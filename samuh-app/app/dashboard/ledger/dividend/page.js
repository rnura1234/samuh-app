// app/dashboard/ledger/dividend/page.js
import { createAdminClient } from '@/lib/supabase/server'

export default async function DividendPage() {
  const supabase = createAdminClient()
  const currentYear = new Date().getFullYear()

  // Get all active members
  const { data: members } = await supabase
    .from('members')
    .select('id, name')
    .eq('status', 'active')

  // Total interest earned from loans this year
  const { data: loans } = await supabase
    .from('loans')
    .select('amount, interest_rate, issued_at, status')
    .in('status', ['active', 'closed'])

  let totalInterest = 0
  loans?.forEach(loan => {
    if (!loan.issued_at) return
    const issuedYear = new Date(loan.issued_at).getFullYear()
    if (issuedYear !== currentYear) return
    const months = Math.ceil(
      (new Date() - new Date(loan.issued_at)) / (1000 * 60 * 60 * 24 * 30)
    )
    totalInterest += (Number(loan.amount) * loan.interest_rate * months) / 100
  })

  // Each member gets equal share
  const perMember = members?.length > 0
    ? Math.floor(totalInterest / members.length)
    : 0

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">
        Year-end dividend
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Interest earned distribution for {currentYear}
      </p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total interest earned</p>
          <p className="text-xl font-semibold text-green-600">
            ₹{Math.round(totalInterest).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Active members</p>
          <p className="text-xl font-semibold text-gray-800">
            {members?.length || 0}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Per member share</p>
          <p className="text-xl font-semibold text-blue-600">
            ₹{perMember.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Per member breakdown */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50">
          <p className="text-sm font-medium text-gray-700">
            Member-wise dividend distribution
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">#</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Member</th>
              <th className="text-right px-5 py-3 text-gray-500 font-medium">Dividend share</th>
            </tr>
          </thead>
          <tbody>
            {members?.map((m, i) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                <td className="px-5 py-3 font-medium text-gray-800">{m.name}</td>
                <td className="px-5 py-3 text-right text-green-600 font-medium">
                  ₹{perMember.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Dividend is split equally among all active members at year end.
      </p>
    </div>
  )
}