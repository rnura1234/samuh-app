// app/dashboard/loans/page.js
import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LoanActions from './LoanActions'

export default async function LoansPage() {
  const supabase = createAdminClient()

  const { data: loans } = await supabase
    .from('loans')
    .select(`
      *,
      members(name, phone),
      loan_repayments(amount)
    `)
    .order('created_at', { ascending: false })

  const pending  = loans?.filter(l => l.status === 'pending') || []
  const active   = loans?.filter(l => l.status === 'active') || []
  const closed   = loans?.filter(l => l.status === 'closed') || []
  const rejected = loans?.filter(l => l.status === 'rejected') || []

  const totalLoaned = active.reduce((sum, l) => sum + Number(l.amount), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Loans</h2>
          <p className="text-sm text-gray-400 mt-1">{loans?.length || 0} total loans</p>
        </div>
        <Link
          href="/dashboard/loans/apply"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Apply for loan
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Pending approval</p>
          <p className="text-xl font-semibold text-amber-600">{pending.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Active loans</p>
          <p className="text-xl font-semibold text-blue-600">{active.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total loaned out</p>
          <p className="text-xl font-semibold text-gray-800">
            ₹{totalLoaned.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Closed loans</p>
          <p className="text-xl font-semibold text-green-600">{closed.length}</p>
        </div>
      </div>

      {/* Pending loans — shown prominently */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-amber-600 mb-3">
            Pending approval ({pending.length})
          </h3>
          <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
            <LoanTable loans={pending} showActions={true} />
          </div>
        </div>
      )}

      {/* Active loans */}
      {active.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            Active loans ({active.length})
          </h3>
          <div className="bg-white border rounded-xl overflow-hidden">
            <LoanTable loans={active} showActions={false} />
          </div>
        </div>
      )}

      {/* Closed & rejected */}
      {(closed.length > 0 || rejected.length > 0) && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Closed / Rejected ({closed.length + rejected.length})
          </h3>
          <div className="bg-white border rounded-xl overflow-hidden">
            <LoanTable loans={[...closed, ...rejected]} showActions={false} />
          </div>
        </div>
      )}

      {(!loans || loans.length === 0) && (
        <div className="bg-white border rounded-xl py-16 text-center text-gray-400">
          No loans yet. Click "+ Apply for loan" to submit the first one.
        </div>
      )}
    </div>
  )
}

function LoanTable({ loans, showActions }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Member</th>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Amount</th>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Interest</th>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Repaid</th>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Outstanding</th>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
          <th className="text-left px-5 py-3 text-gray-500 font-medium">Action</th>
        </tr>
      </thead>
      <tbody>
        {loans.map(loan => {
          const totalRepaid = loan.loan_repayments?.reduce(
            (sum, r) => sum + Number(r.amount), 0
          ) || 0
          const outstanding = Number(loan.amount) - totalRepaid

          return (
            <tr key={loan.id} className="border-b last:border-0 hover:bg-gray-50 transition">
              <td className="px-5 py-3">
                <p className="font-medium text-gray-800">{loan.members?.name}</p>
                <p className="text-xs text-gray-400">{loan.members?.phone}</p>
              </td>
              <td className="px-5 py-3 text-gray-700">
                ₹{Number(loan.amount).toLocaleString('en-IN')}
              </td>
              <td className="px-5 py-3 text-gray-500">
                {loan.interest_rate}% / month
              </td>
              <td className="px-5 py-3 text-green-600">
                ₹{totalRepaid.toLocaleString('en-IN')}
              </td>
              <td className="px-5 py-3 font-medium text-red-600">
                ₹{outstanding.toLocaleString('en-IN')}
              </td>
              <td className="px-5 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  loan.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                  loan.status === 'active'   ? 'bg-blue-100 text-blue-700' :
                  loan.status === 'closed'   ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-600'
                }`}>
                  {loan.status}
                </span>
              </td>
              <td className="px-5 py-3">
                <Link
                  href={`/dashboard/loans/${loan.id}`}
                  className="text-blue-600 hover:underline text-xs"
                >
                  View
                </Link>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}