// app/dashboard/deposits/DepositsRegister.js
'use client'
import { useState, useTransition } from 'react'
import {
  generateMonthlyDeposits,
  markDepositPaid,
  markDepositUnpaid,
} from '@/app/actions/deposits'

const MONTHS = [
  'जन', 'फर', 'मार', 'अप्र', 'मई', 'जून',
  'जुल', 'अग', 'सित', 'अक्ट', 'नव', 'दिस'
]

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function DepositsRegister({ members, deposits, year, settings }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage]         = useState(null)
  const [selectedCell, setSelectedCell] = useState(null) // { memberId, month }

  const amount = settings?.monthly_deposit_amount || 1000

  // Build lookup: depositMap[memberId][month] = deposit
  const depositMap = {}
  members.forEach(m => { depositMap[m.id] = {} })
  deposits.forEach(d => {
    if (depositMap[d.member_id]) {
      depositMap[d.member_id][d.month] = d
    }
  })

  // Summary per member
  function getMemberSummary(memberId) {
    const memberDeposits = Object.values(depositMap[memberId] || {})
    const totalPaid   = memberDeposits.filter(d => d.is_paid).length
    const totalAmount = memberDeposits
      .filter(d => d.is_paid)
      .reduce((s, d) => s + Number(d.amount), 0)
    return { totalPaid, totalAmount }
  }

  // Column totals
  function getMonthTotal(month) {
    return members.reduce((sum, m) => {
      const d = depositMap[m.id]?.[month]
      return sum + (d?.is_paid ? Number(d.amount) : 0)
    }, 0)
  }

  const grandTotal = members.reduce((sum, m) => {
    const { totalAmount } = getMemberSummary(m.id)
    return sum + totalAmount
  }, 0)

  async function handleGenerateAll() {
    startTransition(async () => {
      setMessage(null)
      // Generate for all 12 months
      for (let month = 1; month <= 12; month++) {
        await generateMonthlyDeposits(month, year)
      }
      setMessage({ type: 'success', text: 'All month records generated!' })
    })
  }

  async function handleCellClick(memberId, month) {
    const deposit = depositMap[memberId]?.[month]
    if (!deposit) {
      setMessage({ type: 'error', text: `Generate deposits first for this month.` })
      return
    }

    setSelectedCell({ memberId, month })
    startTransition(async () => {
      const res = deposit.is_paid
        ? await markDepositUnpaid(deposit.id)
        : await markDepositPaid(deposit.id)

      setSelectedCell(null)
      if (res.error) setMessage({ type: 'error', text: res.error })
      else setMessage(null)
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={handleGenerateAll}
          disabled={isPending}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isPending ? 'Processing...' : 'Generate all months'}
        </button>
        <span className="text-xs text-gray-400">
          Monthly deposit: ₹{amount.toLocaleString('en-IN')} · Click a cell to mark paid/unpaid
        </span>
        {message && (
          <span className={`text-xs px-3 py-1 rounded-lg ${
            message.type === 'error'
              ? 'bg-red-50 text-red-600'
              : 'bg-green-50 text-green-600'
          }`}>
            {message.text}
          </span>
        )}
      </div>

      {/* Register table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="text-xs border-collapse" style={{ minWidth: '1100px' }}>

          {/* Header */}
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="border border-blue-600 px-2 py-2 text-center w-8" rowSpan={2}>#</th>
              <th className="border border-blue-600 px-3 py-2 text-left" rowSpan={2} style={{ minWidth: '130px' }}>
                नाम / Name
              </th>
              {MONTHS.map((m, i) => (
                <th key={i} className="border border-blue-600 px-1 py-1 text-center" colSpan={2} style={{ minWidth: '80px' }}>
                  {m}
                </th>
              ))}
              <th className="border border-blue-600 px-2 py-2 text-center" rowSpan={2} style={{ minWidth: '80px' }}>
                कुल जमा
              </th>
              <th className="border border-blue-600 px-2 py-2 text-center" rowSpan={2} style={{ minWidth: '60px' }}>
                माह
              </th>
            </tr>
            <tr className="bg-blue-600 text-white text-center">
              {MONTHS.map((_, i) => (
                <>
                  <th key={`a${i}`} className="border border-blue-500 px-1 py-1" style={{ minWidth: '40px' }}>जमा</th>
                  <th key={`b${i}`} className="border border-blue-500 px-1 py-1" style={{ minWidth: '40px' }}>✓</th>
                </>
              ))}
            </tr>
          </thead>

          <tbody>
            {members.map((member, idx) => {
              const { totalPaid, totalAmount } = getMemberSummary(member.id)

              return (
                <tr
                  key={member.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {/* Serial */}
                  <td className="border border-gray-200 text-center text-gray-500 py-2">
                    {idx + 1}
                  </td>

                  {/* Name */}
                  <td className="border border-gray-200 px-2 py-2">
                    <p className="font-medium text-gray-800 leading-tight">{member.name}</p>
                    {member.address && (
                      <p className="text-gray-400 text-xs leading-tight truncate max-w-xs">
                        {member.address}
                      </p>
                    )}
                  </td>

                  {/* Month cells */}
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                    const deposit = depositMap[member.id]?.[month]
                    const isPaid  = deposit?.is_paid || false
                    const isLoading =
                      isPending &&
                      selectedCell?.memberId === member.id &&
                      selectedCell?.month === month

                    return (
                      <>
                        {/* Amount column */}
                        <td
                          key={`amt-${month}`}
                          className="border border-gray-200 text-center py-2 text-gray-600"
                        >
                          {deposit ? amount.toLocaleString('en-IN') : ''}
                        </td>

                        {/* Paid toggle column */}
                        <td
                          key={`chk-${month}`}
                          className={`border border-gray-200 text-center py-2 cursor-pointer transition select-none ${
                            isLoading
                              ? 'bg-gray-100'
                              : isPaid
                              ? 'bg-green-50 hover:bg-green-100'
                              : deposit
                              ? 'hover:bg-gray-100'
                              : 'bg-gray-50'
                          }`}
                          onClick={() => handleCellClick(member.id, month)}
                          title={
                            !deposit
                              ? 'Not generated'
                              : isPaid
                              ? `Paid on ${new Date(deposit.paid_at).toLocaleDateString('en-IN')} — click to undo`
                              : `Click to mark ${MONTHS_FULL[month - 1]} as paid`
                          }
                        >
                          {isLoading ? (
                            <span className="text-gray-400">...</span>
                          ) : isPaid ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : deposit ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <span className="text-gray-200">·</span>
                          )}
                        </td>
                      </>
                    )
                  })}

                  {/* Total deposited */}
                  <td className="border border-gray-200 text-center py-2 font-semibold text-gray-800">
                    {totalAmount > 0
                      ? `₹${totalAmount.toLocaleString('en-IN')}`
                      : '—'}
                  </td>

                  {/* Months paid count */}
                  <td className="border border-gray-200 text-center py-2 text-gray-600">
                    {totalPaid > 0 ? totalPaid : '—'}
                  </td>
                </tr>
              )
            })}

            {/* Column totals row */}
            <tr className="bg-blue-50 font-semibold">
              <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right text-gray-700 text-xs">
                मासिक कुल / Monthly total
              </td>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                const monthTotal = getMonthTotal(month)
                return (
                  <>
                    <td key={`t-amt-${month}`} className="border border-gray-300 text-center py-2 text-gray-600 text-xs">
                      {monthTotal > 0 ? monthTotal.toLocaleString('en-IN') : ''}
                    </td>
                    <td key={`t-chk-${month}`} className="border border-gray-300 text-center py-2 text-blue-700 text-xs">
                      {deposits.filter(d => d.month === month && d.is_paid).length > 0
                        ? deposits.filter(d => d.month === month && d.is_paid).length
                        : ''}
                    </td>
                  </>
                )
              })}
              <td className="border border-gray-300 text-center py-2 text-blue-800">
                ₹{grandTotal.toLocaleString('en-IN')}
              </td>
              <td className="border border-gray-300 text-center py-2 text-blue-700">
                {members.reduce((s, m) => s + getMemberSummary(m.id).totalPaid, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="text-green-600 font-bold">✓</span> Paid
        </span>
        <span className="flex items-center gap-1">
          <span className="text-gray-400">—</span> Unpaid (generated)
        </span>
        <span className="flex items-center gap-1">
          <span className="text-gray-300">·</span> Not generated yet
        </span>
        <span className="ml-auto">
          Click any ✓/— cell to toggle paid status
        </span>
      </div>
    </div>
  )
}