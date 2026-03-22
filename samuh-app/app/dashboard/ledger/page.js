// app/dashboard/ledger/page.js
import { createAdminClient } from '@/lib/supabase/server'

export default async function LedgerPage() {
  const supabase = createAdminClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, members(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const totalCredits = transactions
    ?.filter(t => t.direction === 'credit')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0

  const totalDebits = transactions
    ?.filter(t => t.direction === 'debit')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0

  const balance = totalCredits - totalDebits

  const typeLabels = {
    deposit: 'Monthly deposit',
    deposit_late_fee: 'Late fee',
    loan_issued: 'Loan issued',
    loan_repayment: 'Loan repayment',
    loan_interest: 'Loan interest',
    dividend: 'Dividend',
    expense: 'Expense',
    other: 'Other',
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Ledger</h2>
        <p className="text-sm text-gray-400 mt-1">Full transaction audit trail</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total credits</p>
          <p className="text-xl font-semibold text-green-600">
            ₹{totalCredits.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total debits</p>
          <p className="text-xl font-semibold text-red-500">
            ₹{totalDebits.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Net balance</p>
          <p className={`text-xl font-semibold ${balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
            ₹{balance.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Member</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Type</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Note</th>
              <th className="text-right px-5 py-3 text-gray-500 font-medium">Credit</th>
              <th className="text-right px-5 py-3 text-gray-500 font-medium">Debit</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map(t => (
              <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(t.created_at).toLocaleDateString('en-IN')}
                </td>
                <td className="px-5 py-3 text-gray-700">
                  {t.members?.name || '—'}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    t.type === 'deposit'         ? 'bg-green-100 text-green-700' :
                    t.type === 'loan_issued'     ? 'bg-red-100 text-red-600' :
                    t.type === 'loan_repayment'  ? 'bg-blue-100 text-blue-700' :
                    t.type === 'loan_interest'   ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {typeLabels[t.type] || t.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">{t.note || '—'}</td>
                <td className="px-5 py-3 text-right font-medium text-green-600">
                  {t.direction === 'credit'
                    ? `₹${Number(t.amount).toLocaleString('en-IN')}`
                    : '—'}
                </td>
                <td className="px-5 py-3 text-right font-medium text-red-500">
                  {t.direction === 'debit'
                    ? `₹${Number(t.amount).toLocaleString('en-IN')}`
                    : '—'}
                </td>
              </tr>
            ))}

            {(!transactions || transactions.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}