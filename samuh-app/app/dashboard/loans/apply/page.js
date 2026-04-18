// app/dashboard/loans/apply/page.js
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApplyLoanForm from './ApplyLoanForm'

export default async function ApplyLoanPage() {
  const { user, samuh, member } = await requireAuth()

  // Inactive members cannot apply
  if (member?.status === 'inactive') {
    redirect('/dashboard?error=inactive')
  }

  const supabase = createAdminClient()

  // ✅ Get total paid deposits for this member in this samuh
  const { data: deposits } = await supabase
    .from('deposits')
    .select('amount')
    .eq('member_id', member.id)
    .eq('samuh_id', samuh.id)
    .eq('is_paid', true)

  const totalDeposited = deposits?.reduce(
    (sum, d) => sum + Number(d.amount), 0
  ) || 0

  // ✅ Get samuh settings for interest rate and max loan multiplier
  const maxLoanMultiplier = samuh.max_loan_multiplier || 3
  const interestRate      = samuh.loan_interest_rate  || 2
  // const maxLoan           = totalDeposited * maxLoanMultiplier

  // ✅ Check if member already has a pending or active loan
  const { data: existingLoans } = await supabase
    .from('loans')
    .select('id, status, amount')
    .eq('user_id', user.id)
    .eq('samuh_id', samuh.id)
    .in('status', ['pending', 'active'])

  const hasActiveLoan   = existingLoans?.some(l => l.status === 'active')
  const hasPendingLoan  = existingLoans?.some(l => l.status === 'pending')

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">Apply for loan</h2>
      <p className="text-sm text-gray-400 mb-6">
        Submit a loan request for admin approval — {samuh.name}
      </p>

      {/* Existing loan warning */}
      {hasPendingLoan && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-amber-700 font-medium">
            You already have a pending loan application
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Please wait for admin approval before applying again.
          </p>
        </div>
      )}

      {hasActiveLoan && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-700 font-medium">
            You already have an active loan
          </p>
          <p className="text-xs text-red-600 mt-1">
            Please repay your current loan before applying for a new one.
          </p>
        </div>
      )}

      {/* Eligibility info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800 font-medium mb-2">
          Your loan eligibility
        </p>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-blue-600">Total deposits paid</span>
            <span className="text-blue-800 font-medium">
              ₹{totalDeposited.toLocaleString('en-IN')}
            </span>
          </div>
          {/* <div className="flex justify-between text-sm">
            <span className="text-blue-600">
              Max loan ({maxLoanMultiplier}× deposits)
            </span>
            <span className="text-blue-800 font-medium">
              ₹{maxLoan.toLocaleString('en-IN')}
            </span>
          </div> */}
          <div className="flex justify-between text-sm">
            <span className="text-blue-600">Interest rate</span>
            <span className="text-blue-800 font-medium">
              {interestRate}% per month
            </span>
          </div>
        </div>

        {totalDeposited === 0 && (
          <p className="text-xs text-red-500 mt-2">
            You need at least one paid deposit to be eligible for a loan.
          </p>
        )}
      </div>

      <ApplyLoanForm
        totalDeposited={totalDeposited}
        // maxLoan={maxLoan}
        interestRate={interestRate}
        samuhId={samuh.id}
        userId={user.id}
        disabled={hasActiveLoan || hasPendingLoan || totalDeposited === 0}
      />
    </div>
  )
}