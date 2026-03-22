// app/dashboard/loans/[id]/page.js
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RepaymentForm from './RepaymentForm'
import LoanActions from '../LoanActions'

export default async function LoanDetailPage({ params }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: loan } = await supabase
    .from('loans')
    .select(`
      *,
      members(name, phone),
      loan_repayments(*)
    `)
    .eq('id', id)
    .single()

  if (!loan) redirect('/dashboard/loans')

  const totalRepaid = loan.loan_repayments?.reduce(
    (sum, r) => sum + Number(r.amount), 0
  ) || 0

  const outstanding = Number(loan.amount) - totalRepaid

  // Calculate interest accrued
  const monthsActive = loan.issued_at
    ? Math.ceil(
        (new Date() - new Date(loan.issued_at)) / (1000 * 60 * 60 * 24 * 30)
      )
    : 0
  const interestAccrued = loan.status === 'active'
    ? (Number(loan.amount) * loan.interest_rate * monthsActive) / 100
    : 0

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/loans"
        className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block"
      >
        ← Back to loans
      </Link>

      {/* Loan header */}
      <div className="bg-white border rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {loan.members?.name}
            </h2>
            <p className="text-sm text-gray-400">{loan.members?.phone}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            loan.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
            loan.status === 'active'   ? 'bg-blue-100 text-blue-700' :
            loan.status === 'closed'   ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-600'
          }`}>
            {loan.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">Loan amount</p>
            <p className="text-lg font-semibold text-gray-800">
              ₹{Number(loan.amount).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Interest rate</p>
            <p className="text-lg font-semibold text-gray-800">
              {loan.interest_rate}% / month
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Issued on</p>
            <p className="text-sm text-gray-700">
              {loan.issued_at
                ? new Date(loan.issued_at).toLocaleDateString('en-IN')
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Due date</p>
            <p className="text-sm text-gray-700">
              {loan.due_date
                ? new Date(loan.due_date).toLocaleDateString('en-IN')
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Reason</p>
            <p className="text-sm text-gray-700">{loan.reason || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Interest accrued</p>
            <p className="text-sm font-medium text-red-600">
              ₹{interestAccrued.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Principal</p>
          <p className="text-lg font-semibold text-gray-800">
            ₹{Number(loan.amount).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total repaid</p>
          <p className="text-lg font-semibold text-green-600">
            ₹{totalRepaid.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Outstanding</p>
          <p className="text-lg font-semibold text-red-600">
            ₹{outstanding.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Admin actions for pending loans */}
      {loan.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-amber-800 mb-3">
            This loan is awaiting approval
          </p>
          <LoanActions loanId={loan.id} />
        </div>
      )}

      {/* Repayment form for active loans */}
      {loan.status === 'active' && outstanding > 0 && (
        <RepaymentForm loanId={loan.id} outstanding={outstanding} />
      )}

      {/* Repayment history */}
      {loan.loan_repayments && loan.loan_repayments.length > 0 && (
        <div className="bg-white border rounded-xl p-5 mt-4">
          <h3 className="font-medium text-gray-700 mb-3">Repayment history</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-gray-400 font-normal">#</th>
                <th className="text-left py-2 text-gray-400 font-normal">Amount</th>
                <th className="text-left py-2 text-gray-400 font-normal">Date</th>
                <th className="text-left py-2 text-gray-400 font-normal">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loan.loan_repayments
                .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
                .map((r, i) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 text-green-600 font-medium">
                      ₹{Number(r.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(r.paid_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2 text-gray-400">{r.notes || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}