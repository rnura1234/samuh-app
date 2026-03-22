// app/dashboard/deposits/MemberDepositRow.js
'use client'
import { useState } from 'react'
import { saveMonthlyEntry } from '@/app/actions/deposits'

export default function MemberDepositRow({
  index, member, deposit, loan, repayment,
  month, year, settings
}) {
  const defaultAmount = settings?.monthly_deposit_amount || 1000

  const [saving, setSaving] = useState({
    bachat:    deposit?.amount     || defaultAmount,
    fine:      deposit?.late_fee   || 0,
    otherFee:  deposit?.notes      ? 0 : 0,
  })

  const [loanEntry, setLoanEntry] = useState({
    returnAmount: repayment?.amount || 0,
    interest:     0,
    otherFee:     0,
  })

  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(!!deposit?.is_paid)
  const [message,  setMessage]  = useState(null)
  const [expanded, setExpanded] = useState(!deposit?.is_paid)

  // Saving totals
  const savingTotal = Number(saving.bachat || 0) +
                      Number(saving.fine   || 0) +
                      Number(saving.otherFee || 0)

  // Loan totals
  const loanTotal = Number(loanEntry.returnAmount || 0) +
                    Number(loanEntry.interest      || 0) +
                    Number(loanEntry.otherFee      || 0)

  // Remaining loan
  const oldOutstanding = loan?.outstanding || 0
  const remainingLoan  = oldOutstanding - Number(loanEntry.returnAmount || 0)

  async function handleSave() {
    setLoading(true)
    setMessage(null)

    const res = await saveMonthlyEntry({
      memberId:     member.id,
      month,
      year,
      depositId:    deposit?.id || null,
      bachat:       Number(saving.bachat   || 0),
      fine:         Number(saving.fine     || 0),
      otherFee:     Number(saving.otherFee || 0),
      loanId:       loan?.id || null,
      loanReturn:   Number(loanEntry.returnAmount || 0),
      loanInterest: Number(loanEntry.interest     || 0),
      loanOtherFee: Number(loanEntry.otherFee     || 0),
    })

    setLoading(false)

    if (res.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: 'Saved!' })
      setSaved(true)
      setTimeout(() => {
        setMessage(null)
        setExpanded(false)
      }, 1500)
    }
  }

  return (
    <div className={`bg-white ${saved ? '' : 'bg-amber-50/30'}`}>
      {/* Member header row — click to expand/collapse */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-6 text-center">{index}</span>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{member.name}</p>
            <p className="text-xs text-gray-400">{member.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Saved ✓
            </span>
          )}
          {loan && (
            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
              Loan: ₹{oldOutstanding.toLocaleString('en-IN')}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20" fill="none"
          >
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Expanded entry form */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 bg-gray-50 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── Saving (Bachat) section ── */}
            <div className="bg-white border rounded-xl overflow-hidden">
              <div className="bg-green-600 text-white px-4 py-2">
                <p className="text-sm font-semibold">बचत / Saving (Bachat)</p>
              </div>
              <div className="p-4 space-y-3">

                {/* 1. Monthly saving */}
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 w-32 shrink-0">
                    1. मासिक बचत
                    <span className="block text-gray-400">Monthly saving</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={saving.bachat}
                    onChange={e => setSaving({ ...saving, bachat: e.target.value })}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* 2. Fine */}
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 w-32 shrink-0">
                    2. जुर्माना
                    <span className="block text-gray-400">Fine</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={saving.fine}
                    onChange={e => setSaving({ ...saving, fine: e.target.value })}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* 3. Other fee */}
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 w-32 shrink-0">
                    3. अन्य शुल्क
                    <span className="block text-gray-400">Other fee</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={saving.otherFee}
                    onChange={e => setSaving({ ...saving, otherFee: e.target.value })}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t pt-2 mt-1">
                  <span className="text-xs font-semibold text-gray-700">4. कुल / Total (1+2+3)</span>
                  <span className="text-sm font-bold text-green-700">
                    ₹{savingTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Loan Payment section ── */}
            <div className="bg-white border rounded-xl overflow-hidden">
              <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between">
                <p className="text-sm font-semibold">ऋण भुगतान / Loan Payment</p>
                {!loan && (
                  <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full">No active loan</span>
                )}
              </div>
              <div className="p-4 space-y-3">

                {/* Outstanding info */}
                {loan && (
                  <div className="bg-red-50 rounded-lg px-3 py-2 flex items-center justify-between mb-1">
                    <span className="text-xs text-red-600">पुराना बकाया / Old outstanding</span>
                    <span className="text-sm font-semibold text-red-700">
                      ₹{oldOutstanding.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* 1. Loan return */}
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 w-32 shrink-0">
                    1. ऋण वापसी
                    <span className="block text-gray-400">Loan return</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={oldOutstanding}
                    value={loanEntry.returnAmount}
                    onChange={e => setLoanEntry({ ...loanEntry, returnAmount: e.target.value })}
                    disabled={!loan}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>

                {/* 2. Interest */}
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 w-32 shrink-0">
                    2. ब्याज
                    <span className="block text-gray-400">Interest</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={loanEntry.interest}
                    onChange={e => setLoanEntry({ ...loanEntry, interest: e.target.value })}
                    disabled={!loan}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>

                {/* 3. Other fee */}
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 w-32 shrink-0">
                    3. अन्य शुल्क
                    <span className="block text-gray-400">Other fee</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={loanEntry.otherFee}
                    onChange={e => setLoanEntry({ ...loanEntry, otherFee: e.target.value })}
                    disabled={!loan}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>

                {/* 4. Total paid this month */}
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-xs font-semibold text-gray-700">4. कुल भुगतान (1+2+3)</span>
                  <span className="text-sm font-bold text-red-700">
                    ₹{loanTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 5. Remaining loan */}
                <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  remainingLoan > 0 ? 'bg-red-50' : 'bg-green-50'
                }`}>
                  <span className="text-xs font-semibold text-gray-700">
                    5. शेष ऋण / Remaining loan
                  </span>
                  <span className={`text-sm font-bold ${
                    remainingLoan > 0 ? 'text-red-700' : 'text-green-700'
                  }`}>
                    ₹{Math.max(0, remainingLoan).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center justify-between mt-4">
            {message && (
              <span className={`text-sm px-3 py-1.5 rounded-lg ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-green-50 text-green-600'
              }`}>
                {message.text}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="ml-auto bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Saving...' : `Save — ${member.name}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}