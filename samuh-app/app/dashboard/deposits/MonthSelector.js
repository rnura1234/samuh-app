// app/dashboard/deposits/MonthSelector.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MemberDepositRow from './MemberDepositRow'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export default function MonthSelector({
  currentMonth, currentYear,
  members, deposits, loans, repayments, settings
}) {
  const router = useRouter()

  function handleMonthChange(e) {
    const [year, month] = e.target.value.split('-')
    router.push(`/dashboard/deposits?month=${month}&year=${year}`)
  }

  // Build deposit map by member
  const depositMap = {}
  deposits.forEach(d => { depositMap[d.member_id] = d })

  // Build loan map by member — get active loan and outstanding balance
  const loanMap = {}
  loans.forEach(l => {
    const totalRepaid = l.loan_repayments?.reduce((s, r) => s + Number(r.amount), 0) || 0
    const outstanding = Number(l.amount) - totalRepaid
    if (!loanMap[l.member_id] || outstanding > 0) {
      loanMap[l.member_id] = { ...l, outstanding }
    }
  })

  // Build repayment map by loan_id for this month
  const repaymentMap = {}
  repayments.forEach(r => { repaymentMap[r.loan_id] = r })

  // Summary totals
  const totalSaving     = deposits.reduce((s, d) => s + Number(d.amount || 0), 0)
  const totalFine       = deposits.reduce((s, d) => s + Number(d.late_fee || 0), 0)
  const totalCollection = totalSaving + totalFine
  const paidCount       = deposits.filter(d => d.is_paid).length

  return (
    <div>
      {/* Month picker */}
      <div className="flex items-center gap-4 mb-5">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Select month</label>
          <input
            type="month"
            value={`${currentYear}-${String(currentMonth).padStart(2, '0')}`}
            onChange={handleMonthChange}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3 pt-5">
          <div className="bg-white border rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-gray-400">Paid</p>
            <p className="text-lg font-semibold text-green-600">{paidCount}/{members.length}</p>
          </div>
          <div className="bg-white border rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-gray-400">Saving collected</p>
            <p className="text-lg font-semibold text-gray-800">₹{totalCollection.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Month heading */}
      <div className="bg-blue-700 text-white rounded-t-xl px-5 py-3">
        <h3 className="font-semibold text-base">
          {MONTH_NAMES[currentMonth - 1]} {currentYear}
        </h3>
        <p className="text-blue-200 text-xs mt-0.5">
          Monthly deposit: ₹{settings?.monthly_deposit_amount || 1000} per member
        </p>
      </div>

      {/* Member rows */}
      <div className="border border-t-0 rounded-b-xl overflow-hidden divide-y">
        {members.map((member, idx) => (
          <MemberDepositRow
            key={member.id}
            index={idx + 1}
            member={member}
            deposit={depositMap[member.id] || null}
            loan={loanMap[member.id] || null}
            repayment={repaymentMap[loanMap[member.id]?.id] || null}
            month={currentMonth}
            year={currentYear}
            settings={settings}
          />
        ))}

        {members.length === 0 && (
          <div className="py-12 text-center text-gray-400 bg-white">
            No active members found.
          </div>
        )}
      </div>
    </div>
  )
}