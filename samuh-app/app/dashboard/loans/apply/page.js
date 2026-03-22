// app/dashboard/loans/apply/page.js
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApplyLoanForm from './ApplyLoanForm'

export default async function ApplyLoanPage() {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await adminSupabase
    .from('members')
    .select('id, name, status')
    .eq('user_id', user.id)
    .single()

  // Calculate max loan for this member
  const { data: deposits } = await adminSupabase
    .from('deposits')
    .select('amount')
    .eq('member_id', member?.id)
    .eq('is_paid', true)

  const totalDeposited = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0
  const maxLoan = totalDeposited * 3

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">Apply for loan</h2>
      <p className="text-sm text-gray-400 mb-6">
        Submit a loan request for admin approval.
      </p>

      {/* Eligibility info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800 font-medium mb-1">Your loan eligibility</p>
        <p className="text-sm text-blue-600">
          Total deposits: ₹{totalDeposited.toLocaleString('en-IN')}
        </p>
        <p className="text-sm text-blue-600">
          Maximum loan: ₹{maxLoan.toLocaleString('en-IN')} (3× deposits)
        </p>
        <p className="text-sm text-blue-600">Interest rate: 2% per month</p>
      </div>

      <ApplyLoanForm maxLoan={maxLoan} />
    </div>
  )
}