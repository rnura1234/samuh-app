// app/dashboard/deposits/DepositsGrid.js
'use client'
import { useState, useTransition } from 'react'
import {
  generateMonthlyDeposits,
  markDepositPaid,
  markDepositUnpaid,
} from '@/app/actions/deposits'

export default function DepositsGrid({ members, deposits, month, year, settings }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState(null)
  const [loadingId, setLoadingId] = useState(null)

  // Map deposits by member_id for quick lookup
  const depositMap = {}
  deposits.forEach(d => { depositMap[d.member_id] = d })

  const monthName = new Date(year, month - 1).toLocaleString('en-IN', {
    month: 'long', year: 'numeric'
  })

  async function handleGenerate() {
    startTransition(async () => {
      setMessage(null)
      const res = await generateMonthlyDeposits(month, year)
      if (res.error) setMessage({ type: 'error', text: res.error })
      else setMessage({ type: 'success', text: 'Deposit records generated for all active members!' })
    })
  }

  async function handleTogglePaid(member) {
    const deposit = depositMap[member.id]
    if (!deposit) {
      setMessage({ type: 'error', text: 'Generate deposits first before marking as paid.' })
      return
    }

    setLoadingId(member.id)
    startTransition(async () => {
      const res = deposit.is_paid
        ? await markDepositUnpaid(deposit.id)
        : await markDepositPaid(deposit.id)

      setLoadingId(null)
      if (res.error) setMessage({ type: 'error', text: res.error })
    })
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
        <p className="text-sm font-medium text-gray-700">{monthName}</p>
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isPending ? 'Generating...' : 'Generate this month'}
        </button>
      </div>

      {message && (
        <div className={`px-5 py-3 text-sm ${
          message.type === 'error'
            ? 'bg-red-50 text-red-600'
            : 'bg-green-50 text-green-600'
        }`}>
          {message.text}
        </div>
      )}

      {/* Members list */}
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left px-5 py-3 text-gray-500 font-medium">#</th>
            <th className="text-left px-5 py-3 text-gray-500 font-medium">Member</th>
            <th className="text-left px-5 py-3 text-gray-500 font-medium">Amount</th>
            <th className="text-left px-5 py-3 text-gray-500 font-medium">Late fee</th>
            <th className="text-left px-5 py-3 text-gray-500 font-medium">Paid on</th>
            <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
            <th className="text-left px-5 py-3 text-gray-500 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => {
            const deposit = depositMap[member.id]
            const isPaid = deposit?.is_paid || false
            const isLoading = loadingId === member.id

            return (
              <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-gray-400">{index + 1}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800">{member.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-700">
                  {deposit
                    ? `₹${Number(deposit.amount).toLocaleString('en-IN')}`
                    : '—'}
                </td>
                <td className="px-5 py-3 text-red-500">
                  {deposit?.late_fee > 0
                    ? `₹${Number(deposit.late_fee).toLocaleString('en-IN')}`
                    : '—'}
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {deposit?.paid_at
                    ? new Date(deposit.paid_at).toLocaleDateString('en-IN')
                    : '—'}
                </td>
                <td className="px-5 py-3">
                  {!deposit ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                      Not generated
                    </span>
                  ) : isPaid ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      Paid
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-600">
                      Unpaid
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {deposit && (
                    <button
                      onClick={() => handleTogglePaid(member)}
                      disabled={isLoading || isPending}
                      className={`text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
                        isPaid
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {isLoading ? '...' : isPaid ? 'Mark unpaid' : 'Mark paid'}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}

          {members.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-10 text-gray-400">
                No active members found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}