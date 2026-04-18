// app/dashboard/ledger/dividend/page.js
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

export default async function DividendPage() {
  const { samuh } = await requireAdmin()
  const supabase   = createAdminClient()
  const currentYear = new Date().getFullYear()

  // ✅ Fetch active members from samuh_members filtered by samuh_id
  const { data: members } = await supabase
    .from('samuh_members')
    .select('id, name')
    .eq('samuh_id', samuh.id)
    .eq('status', 'active')
    .order('name')

  // ✅ Fetch loans for this samuh only
  const { data: loans } = await supabase
    .from('loans')
    .select('amount, interest_rate, issued_at, status')
    .eq('samuh_id', samuh.id)
    .in('status', ['active', 'closed'])

  // ✅ Fetch actual repayments to get real interest collected
  const { data: repayments } = await supabase
    .from('loan_repayments')
    .select('amount, notes, paid_at')
    .eq('samuh_id', samuh.id)

  // Method 1 — Interest from repayment notes (actual collected)
  let actualInterestCollected = 0
  repayments?.forEach(r => {
    if (!r.notes) return
    const match = r.notes.match(/Interest:\s*₹?([\d.]+)/)
    if (match) actualInterestCollected += parseFloat(match[1]) || 0
  })

  // Method 2 — Interest accrued this year (theoretical)
  let accruedInterestThisYear = 0
  loans?.forEach(loan => {
    if (!loan.issued_at) return

    const issuedDate = new Date(loan.issued_at)
    const issuedYear = issuedDate.getFullYear()

    // Only count loans issued this year or still active from previous years
    const startDate = issuedYear >= currentYear
      ? issuedDate
      : new Date(`${currentYear}-01-01`) // start from Jan 1 for older loans

    const endDate = loan.status === 'closed'
      ? new Date() // approximate
      : new Date()

    const months = Math.max(1, Math.ceil(
      (endDate - startDate) / (1000 * 60 * 60 * 24 * 30)
    ))

    accruedInterestThisYear += (Number(loan.amount) * loan.interest_rate * months) / 100
  })

  // Use actual collected interest as the basis for dividend
  const totalInterest = actualInterestCollected > 0
    ? actualInterestCollected
    : Math.round(accruedInterestThisYear)

  const memberCount = members?.length || 0
  const perMember   = memberCount > 0
    ? Math.floor(totalInterest / memberCount)
    : 0

  // Remainder after equal distribution
  const remainder = totalInterest - (perMember * memberCount)

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">
        Year-end dividend
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Interest distribution for {samuh.name} — {currentYear}
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total interest earned</p>
          <p className="text-xl font-semibold text-green-600">
            ₹{Math.round(totalInterest).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Active members</p>
          <p className="text-xl font-semibold text-gray-800">
            {memberCount}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Per member share</p>
          <p className="text-xl font-semibold text-blue-600">
            ₹{perMember.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Interest breakdown */}
      <div className="bg-white border rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Interest breakdown</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Actually collected (from repayments)</span>
            <span className="font-medium text-gray-800">
              ₹{Math.round(actualInterestCollected).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Accrued this year (theoretical)</span>
            <span className="font-medium text-gray-800">
              ₹{Math.round(accruedInterestThisYear).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Active loans</span>
            <span className="font-medium text-gray-800">
              {loans?.filter(l => l.status === 'active').length || 0}
            </span>
          </div>
          {remainder > 0 && (
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-500">Remainder (carry forward)</span>
              <span className="font-medium text-amber-600">
                ₹{remainder.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Per member distribution table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">
            Member-wise distribution
          </p>
          <p className="text-xs text-gray-400">
            Equal share per member
          </p>
        </div>

        {memberCount > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">#</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Member</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium">
                  Dividend share
                </th>
              </tr>
            </thead>
            <tbody>
              {members?.map((m, i) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-green-600 font-medium">
                      ₹{perMember.toLocaleString('en-IN')}
                    </span>
                  </td>
                </tr>
              ))}

              {/* Total row */}
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={2} className="px-5 py-3 text-gray-700">
                  Total distributed
                </td>
                <td className="px-5 py-3 text-right text-gray-800">
                  ₹{(perMember * memberCount).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10 text-gray-400">
            No active members found in {samuh.name}.
          </div>
        )}
      </div>

      {perMember === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4">
          <p className="text-sm text-amber-700">
            No dividend to distribute yet. Interest will be calculated as loans are repaid.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        Dividend is split equally among all active members at year end.
        Any remainder is carried forward to next year.
      </p>
    </div>
  )
}