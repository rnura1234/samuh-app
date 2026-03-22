// app/dashboard/reports/page.js
import { createAdminClient } from '@/lib/supabase/server'
import ReportActions from './ReportActions'

export default async function ReportsPage() {
  const supabase = createAdminClient()

  const currentMonth = new Date().getMonth() + 1
  const currentYear  = new Date().getFullYear()

  // Members
  const { data: members } = await supabase
    .from('members')
    .select('id, name, phone, join_date, status, role')
    .eq('status', 'active')
    .order('name')

  // Deposits this year
  const { data: deposits } = await supabase
    .from('deposits')
    .select('*, members(name)')
    .eq('year', currentYear)
    .order('month')

  // Loans
  const { data: loans } = await supabase
    .from('loans')
    .select('*, members(name), loan_repayments(amount)')
    .order('created_at', { ascending: false })

  // Transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, members(name)')
    .order('created_at', { ascending: false })

  // Summary numbers
  const totalDeposited = deposits
    ?.filter(d => d.is_paid)
    .reduce((sum, d) => sum + Number(d.amount), 0) || 0

  const totalLoansOut = loans
    ?.filter(l => l.status === 'active')
    .reduce((sum, l) => sum + Number(l.amount), 0) || 0

  const totalRepayments = loans
    ?.flatMap(l => l.loan_repayments || [])
    .reduce((sum, r) => sum + Number(r.amount), 0) || 0

  const fundBalance = totalDeposited - totalLoansOut + totalRepayments

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Reports</h2>
        <p className="text-sm text-gray-400 mt-1">
          Export and print group financial reports
        </p>
      </div>

      {/* Summary for the report */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Fund balance</p>
          <p className="text-xl font-semibold text-gray-800">
            ₹{fundBalance.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total deposited</p>
          <p className="text-xl font-semibold text-green-600">
            ₹{totalDeposited.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Loans outstanding</p>
          <p className="text-xl font-semibold text-red-500">
            ₹{totalLoansOut.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Active members</p>
          <p className="text-xl font-semibold text-gray-800">
            {members?.length || 0}
          </p>
        </div>
      </div>

      {/* Report cards */}
      <ReportActions
        members={members || []}
        deposits={deposits || []}
        loans={loans || []}
        transactions={transactions || []}
        summary={{ totalDeposited, totalLoansOut, totalRepayments, fundBalance }}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
    </div>
  )
}