// app/dashboard/members/[id]/page.js
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MemberActions from './MemberActions'

export default async function MemberDetailPage({ params }) {
  // ✅ await params first — required in Next.js 15
  const { id } = await params

  const supabase = createAdminClient()

  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()

  console.log('member:', member)
  console.log('error:', error)

  if (!member) redirect('/dashboard/members')

  const { data: deposits } = await supabase
    .from('deposits')
    .select('*')
    .eq('member_id', member.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })

  const totalDeposited = deposits
    ?.filter(d => d.is_paid)
    .reduce((sum, d) => sum + Number(d.amount), 0) || 0

  const activeLoans = loans?.filter(l => l.status === 'active') || []
  const totalLoanAmount = activeLoans.reduce((sum, l) => sum + Number(l.amount), 0)

  return (
    <div className="max-w-3xl">
      <Link
        href="/dashboard/members"
        className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block"
      >
        ← Back to members
      </Link>

      {/* Profile header */}
      <div className="bg-white border rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{member.name}</h2>
              <p className="text-sm text-gray-400">{member.phone}</p>
              {member.address && (
                <p className="text-sm text-gray-400">{member.address}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              member.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}>
              {member.status}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
              {member.role}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total deposited</p>
          <p className="text-xl font-semibold text-gray-800">
            ₹{totalDeposited.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Active loans</p>
          <p className="text-xl font-semibold text-gray-800">
            {activeLoans.length}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Loan outstanding</p>
          <p className="text-xl font-semibold text-red-600">
            ₹{totalLoanAmount.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Deposit history */}
      <div className="bg-white border rounded-xl p-5 mb-4">
        <h3 className="font-medium text-gray-700 mb-3">Deposit history</h3>
        {deposits && deposits.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-gray-400 font-normal">Month</th>
                <th className="text-left py-2 text-gray-400 font-normal">Amount</th>
                <th className="text-left py-2 text-gray-400 font-normal">Status</th>
                <th className="text-left py-2 text-gray-400 font-normal">Paid on</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map(d => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2 text-gray-700">
                    {new Date(d.year, d.month - 1).toLocaleString('en-IN', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-2 text-gray-700">
                    ₹{Number(d.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      d.is_paid
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {d.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 text-xs">
                    {d.paid_at
                      ? new Date(d.paid_at).toLocaleDateString('en-IN')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">No deposit records yet.</p>
        )}
      </div>

      {/* Actions */}
      <MemberActions member={member} />
    </div>
  )
}