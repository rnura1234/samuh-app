// app/dashboard/page.js
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getActiveSamuh } from '@/lib/samuh'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage({searchParams}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { samuh, member, isSuperAdmin } = await getActiveSamuh(user.id)
  if (!samuh) redirect('/dashboard/samuhs')

  const adminSupabase = createAdminClient()
 const params = await searchParams
  const unauthorized = params.error === 'unauthorized'
  // ── Active members ──────────────────────────────────────────
  const { count: totalMembers } = await adminSupabase
    .from('samuh_members')
    .select('*', { count: 'exact', head: true })
    .eq('samuh_id', samuh.id)
    .eq('status', 'active')

  // ── All paid deposits ───────────────────────────────────────
  const { data: deposits } = await adminSupabase
    .from('deposits')
    .select('amount, late_fee')
    .eq('samuh_id', samuh.id)
    .eq('is_paid', true)

  // 1) Total saving amount (monthly bachat)
  const totalSaving = deposits?.reduce((s, d) => s + Number(d.amount || 0), 0) || 0

  // 2) Total fines collected
  const totalFines = deposits?.reduce((s, d) => s + Number(d.late_fee || 0), 0) || 0

  // ── All loan repayments ─────────────────────────────────────
  const { data: repayments } = await adminSupabase
    .from('loan_repayments')
    .select('amount, notes')
    .eq('samuh_id', samuh.id)

  // 3) Total loan principal returned
  const totalLoanReturned = repayments?.reduce((s, r) => s + Number(r.amount || 0), 0) || 0

  // 4) Total interest collected — stored in notes as "Interest: ₹X"
  let totalInterestCollected = 0
  repayments?.forEach(r => {
    if (r.notes) {
      const match = r.notes.match(/Interest:\s*₹?([\d.]+)/)
      if (match) totalInterestCollected += parseFloat(match[1]) || 0
    }
  })

  // ── Total deposit = saving + fines + interest + other fees ──
  // This is ALL money that has come INTO the group fund
  const totalDeposited = totalSaving + totalFines + totalInterestCollected

  // ── Active loans (money currently out) ─────────────────────
  const { data: activeLoans } = await adminSupabase
    .from('loans')
    .select('amount, loan_repayments(amount)')
    .eq('samuh_id', samuh.id)
    .eq('status', 'active')

  // Total principal currently outstanding
  const totalLoansOut = activeLoans?.reduce((sum, loan) => {
    const repaid = loan.loan_repayments?.reduce(
      (s, r) => s + Number(r.amount || 0), 0
    ) || 0
    return sum + (Number(loan.amount) - repaid)
  }, 0) || 0

  // ── Fund balance = all money in - money currently out ───────
  // = (saving + fines + interest + loan repayments) - outstanding loans
  const totalMoneyIn = totalSaving + totalFines + totalInterestCollected + totalLoanReturned
  const fundBalance = totalMoneyIn - totalLoansOut

  // ── Alerts ──────────────────────────────────────────────────
  const { count: pendingLoans } = await adminSupabase
    .from('loans')
    .select('*', { count: 'exact', head: true })
    .eq('samuh_id', samuh.id)
    .eq('status', 'pending')

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const { count: unpaidCount } = await adminSupabase
    .from('deposits')
    .select('*', { count: 'exact', head: true })
    .eq('samuh_id', samuh.id)
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
        <p className="text-sm text-gray-400 mt-1">{samuh.name}</p>
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
            {unpaidCount} member{unpaidCount > 1 ? 's' : ''} unpaid this month
          </p>
          <Link href="/dashboard/deposits" className="text-sm text-red-600 font-medium hover:underline">
            View →
          </Link>
        </div>
      )}

      {/* Main stats — Fund balance + members */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Fund balance</p>
          <p className="text-3xl font-semibold text-gray-800">
            ₹{fundBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Total in — loans outstanding
          </p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Active members</p>
          <p className="text-3xl font-semibold text-gray-800">
            {totalMembers || 0}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            in {samuh.name}
          </p>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Monthly savings</p>
          <p className="text-lg font-semibold text-gray-800">
            ₹{totalSaving.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Bachat collected</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Fines + other fees</p>
          <p className="text-lg font-semibold text-gray-800">
            ₹{totalFines.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Late fees collected</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Interest collected</p>
          <p className="text-lg font-semibold text-green-600">
            ₹{totalInterestCollected.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-400 mt-1">From loan repayments</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Loans outstanding</p>
          <p className="text-lg font-semibold text-red-500">
            ₹{totalLoansOut.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Yet to be returned</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
  <p className="text-sm font-medium text-gray-700 mb-3">
    Total deposit breakdown
  </p>

  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">Monthly saving (Bachat)</span>
      <span className="font-medium text-gray-800">
        ₹{totalSaving.toLocaleString('en-IN')}
      </span>
    </div>

    <div className="flex justify-between text-sm">
      <span className="text-gray-500">Fines collected</span>
      <span className="font-medium text-gray-800">
        ₹{totalFines.toLocaleString('en-IN')}
      </span>
    </div>

    <div className="flex justify-between text-sm">
      <span className="text-gray-500">Interest collected</span>
      <span className="font-medium text-gray-800">
        ₹{totalInterestCollected.toLocaleString('en-IN')}
      </span>
    </div>

    <div className="border-t pt-2 flex justify-between text-sm font-semibold">
      <span className="text-gray-700">Total deposited</span>
      <span className="text-gray-900">
        ₹{totalDeposited.toLocaleString('en-IN')}
      </span>
    </div>
  </div>
</div>

{/* Quick links — role based */}
<div className="grid grid-cols-3 gap-4">
  {/* Members can always apply for loan */}
  <Link
    href="/dashboard/loans/apply"
    className="bg-white border border-gray-200 rounded-xl p-4 
               shadow-sm hover:shadow-md 
               hover:border-blue-400 hover:bg-blue-50
               hover:-translate-y-1 
               transition-all duration-200 cursor-pointer"
  >
    <p className="font-medium text-gray-800 text-sm flex items-center gap-2">
      💰 Apply for loan
    </p>
    <p className="text-xs text-gray-400 mt-1">
      Submit a new loan request
    </p>
  </Link>

  {/* Admin only */}
  {(member?.role === 'admin' || isSuperAdmin) && (
    <>
      <Link
        href="/dashboard/members/invite"
        className="bg-white border border-gray-200 rounded-xl p-4 
                   shadow-sm hover:shadow-md 
                   hover:border-green-400 hover:bg-green-50
                   hover:-translate-y-1 
                   transition-all duration-200 cursor-pointer"
      >
        <p className="font-medium text-gray-800 text-sm flex items-center gap-2">
          👤 Add member
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Register a new group member
        </p>
      </Link>

      <Link
        href="/dashboard/deposits"
        className="bg-white border border-gray-200 rounded-xl p-4 
                   shadow-sm hover:shadow-md 
                   hover:border-purple-400 hover:bg-purple-50
                   hover:-translate-y-1 
                   transition-all duration-200 cursor-pointer"
      >
        <p className="font-medium text-gray-800 text-sm flex items-center gap-2">
          📥 Record deposit
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Mark monthly payments as paid
        </p>
      </Link>
    </>
  )}
</div>

   
    </div>
  )
}