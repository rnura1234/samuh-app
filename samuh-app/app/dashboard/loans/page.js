// app/dashboard/loans/page.js
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LoanActions from './LoanActions'

export default async function LoansPage() {
  const { samuh, member, isSuperAdmin } = await requireAuth()
  const isAdmin = member?.role === 'admin' || isSuperAdmin

  const supabase = createAdminClient()

 const { data: loans, error } = await supabase
  .from('loans')
  .select(`
    *,
    samuh_members!loans_member_id_fkey(name, phone)
  `)
  .or(`samuh_id.eq.${samuh.id},samuh_id.is.null`)
  .order('created_at', { ascending: false })


  const { data: allRepayments } = await supabase
    .from('loan_repayments')
    .select('loan_id, amount')
    .eq('samuh_id', samuh.id)
console.log("loans", loans);
console.log("allRepayments", allRepayments);
  const loansWithRepayments = loans?.map(loan => {
    const repayments  = allRepayments?.filter(r => r.loan_id === loan.id) || []
    const totalRepaid = repayments.reduce((s, r) => s + Number(r.amount), 0)
    const outstanding = Number(loan.amount) - totalRepaid
    return { ...loan, totalRepaid, outstanding }
  }) || []

  const pending  = loansWithRepayments.filter(l => l.status === 'pending')
  const active   = loansWithRepayments.filter(l => l.status === 'active')
  const closed   = loansWithRepayments.filter(l => l.status === 'closed')
  const rejected = loansWithRepayments.filter(l => l.status === 'rejected')

  const totalLoaned = active.reduce((sum, l) => sum + Number(l.amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Loans</h2>
          <p className="text-sm text-gray-400 mt-1">
            {loansWithRepayments.length} total · {pending.length} pending
          </p>
        </div>
        <Link
          href="/dashboard/loans/apply"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Apply for loan
        </Link>
      </div>

      {/* Summary */}
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

      {/* Pending — admin sees approve/reject, member just sees status */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-amber-600 mb-3">
            Pending approval ({pending.length})
          </h3>
          <div className="bg-white border border-amber-200 rounded-xl divide-y overflow-hidden">
            {pending.map(loan => (
              <div key={loan.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold">
                      {loan.samuh_members?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{loan.samuh_members?.name}</p>
                      <p className="text-xs text-gray-400">{loan.samuh_members?.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-gray-800">
                      ₹{Number(loan.amount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-400">{loan.interest_rate}% / month</p>
                  </div>
                </div>

                {loan.reason && (
                  <div className="mt-3 bg-amber-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Reason:</span> {loan.reason}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <p className="text-xs text-gray-400">
                    Applied: {new Date(loan.created_at).toLocaleDateString('en-IN')}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/loans/${loan.id}`}
                      className="text-xs px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50 transition"
                    >
                      View details
                    </Link>
                    {/* ✅ Only admin sees approve/reject */}
                    {isAdmin && <LoanActions loanId={loan.id} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active loans */}
      {active.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-blue-600 mb-3">
            Active loans ({active.length})
          </h3>
          <div className="bg-white border rounded-xl overflow-hidden">
            <LoanTable loans={active} />
          </div>
        </div>
      )}

      {/* Closed & Rejected */}
      {(closed.length > 0 || rejected.length > 0) && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Closed / Rejected ({closed.length + rejected.length})
          </h3>
          <div className="bg-white border rounded-xl overflow-hidden">
            <LoanTable loans={[...closed, ...rejected]} />
          </div>
        </div>
      )}

      {loansWithRepayments.length === 0 && (
        <div className="bg-white border rounded-xl py-16 text-center">
          <p className="text-gray-400 mb-2">No loans yet.</p>
          <Link href="/dashboard/loans/apply" className="text-blue-600 text-sm hover:underline">
            Apply for first loan →
          </Link>
        </div>
      )}
    </div>
  )
}

function LoanTable({ loans }) {
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
        {loans.map(loan => (
          <tr key={loan.id} className="border-b last:border-0 hover:bg-gray-50 transition">
            <td className="px-5 py-3">
              <p className="font-medium text-gray-800">{loan.samuh_members?.name}</p>
              <p className="text-xs text-gray-400">{loan.samuh_members?.phone}</p>
            </td>
            <td className="px-5 py-3 text-gray-700">
              ₹{Number(loan.amount).toLocaleString('en-IN')}
            </td>
            <td className="px-5 py-3 text-gray-500">
              {loan.interest_rate}% / month
            </td>
            <td className="px-5 py-3 text-green-600">
              ₹{loan.totalRepaid.toLocaleString('en-IN')}
            </td>
            <td className="px-5 py-3 font-medium text-red-600">
              ₹{loan.outstanding.toLocaleString('en-IN')}
            </td>
            <td className="px-5 py-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                loan.status === 'active'   ? 'bg-blue-100 text-blue-700'   :
                loan.status === 'closed'   ? 'bg-green-100 text-green-700' :
                loan.status === 'rejected' ? 'bg-red-100 text-red-600'     :
                'bg-amber-100 text-amber-700'
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
        ))}
      </tbody>
    </table>
  )
}