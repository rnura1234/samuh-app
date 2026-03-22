// app/dashboard/page.js
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await adminSupabase
    .from('members')
    .select('name, role')
    .eq('user_id', user.id)
    .single()

  // Total members
  const { count: totalMembers } = await adminSupabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Total deposits collected
  const { data: deposits } = await adminSupabase
    .from('deposits')
    .select('amount')
    .eq('is_paid', true)

  const totalDeposits = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0

  // Total loans issued (active)
  const { data: activeLoans } = await adminSupabase
    .from('loans')
    .select('amount')
    .eq('status', 'active')

  const totalLoansOut = activeLoans?.reduce((sum, l) => sum + Number(l.amount), 0) || 0

  // Total repayments received
  const { data: repayments } = await adminSupabase
    .from('loan_repayments')
    .select('amount')

  const totalRepayments = repayments?.reduce((sum, r) => sum + Number(r.amount), 0) || 0

  // Interest earned = total repayments - total loans issued (simplified)
  const { data: allLoans } = await adminSupabase
    .from('loans')
    .select('amount, interest_rate, issued_at, status')
    .in('status', ['active', 'closed'])

  let interestEarned = 0
  allLoans?.forEach(loan => {
    if (!loan.issued_at) return
    const months = Math.ceil(
      (new Date() - new Date(loan.issued_at)) / (1000 * 60 * 60 * 24 * 30)
    )
    interestEarned += (Number(loan.amount) * loan.interest_rate * months) / 100
  })

  // Fund balance = deposits + interest - loans out + repayments
  const fundBalance = totalDeposits - totalLoansOut + totalRepayments

  // Pending loans
  const { count: pendingLoans } = await adminSupabase
    .from('loans')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Current month unpaid deposits
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const { count: unpaidCount } = await adminSupabase
    .from('deposits')
    .select('*', { count: 'exact', head: true })
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .eq('is_paid', false)

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Welcome, {member?.name || 'there'}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Here is your Samuh group overview
        </p>
      </div>

      {/* Alerts */}
      {pendingLoans > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-amber-700">
            {pendingLoans} loan{pendingLoans > 1 ? 's' : ''} waiting for approval
          </p>
          <Link href="/dashboard/loans" className="text-sm text-amber-700 font-medium hover:underline">
            Review →
          </Link>
        </div>
      )}

      {unpaidCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
          <p className="text-sm text-red-600">
            {unpaidCount} member{unpaidCount > 1 ? 's' : ''} have not paid this month's deposit
          </p>
          <Link href="/dashboard/deposits" className="text-sm text-red-600 font-medium hover:underline">
            View →
          </Link>
        </div>
      )}

      {/* Main stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Fund balance</p>
          <p className="text-3xl font-semibold text-gray-800">
            ₹{fundBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total available funds</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Interest earned</p>
          <p className="text-3xl font-semibold text-green-600">
            ₹{Math.round(interestEarned).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Accrued on active loans</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Active members</p>
          <p className="text-xl font-semibold text-gray-800">{totalMembers || 0}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total deposited</p>
          <p className="text-xl font-semibold text-gray-800">
            ₹{totalDeposits.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Loans out</p>
          <p className="text-xl font-semibold text-red-500">
            ₹{totalLoansOut.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Repayments in</p>
          <p className="text-xl font-semibold text-green-600">
            ₹{totalRepayments.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        <Link
          href="/dashboard/members/invite"
          className="bg-white border rounded-xl p-4 hover:bg-gray-50 transition"
        >
          <p className="font-medium text-gray-800 text-sm">Add member</p>
          <p className="text-xs text-gray-400 mt-1">Register a new group member</p>
        </Link>
        <Link
          href="/dashboard/deposits"
          className="bg-white border rounded-xl p-4 hover:bg-gray-50 transition"
        >
          <p className="font-medium text-gray-800 text-sm">Record deposit</p>
          <p className="text-xs text-gray-400 mt-1">Mark monthly payments as paid</p>
        </Link>
        <Link
          href="/dashboard/loans/apply"
          className="bg-white border rounded-xl p-4 hover:bg-gray-50 transition"
        >
          <p className="font-medium text-gray-800 text-sm">Apply for loan</p>
          <p className="text-xs text-gray-400 mt-1">Submit a new loan request</p>
        </Link>
      </div>
    </div>
  )
}