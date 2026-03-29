// app/actions/loans.js
'use server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Apply for a loan
export async function applyLoan(formData) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: member } = await adminSupabase
    .from('members')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!member) return { error: 'Member not found' }
  if (member.status !== 'active') return { error: 'Inactive members cannot apply for loans' }

  const amount = parseFloat(formData.get('amount'))
  const reason = formData.get('reason')

  if (!amount || amount <= 0) return { error: 'Invalid loan amount' }

  // Check loan limit — max = 3× total deposits
  const { data: deposits } = await adminSupabase
    .from('deposits')
    .select('amount')
    .eq('member_id', member.id)
    .eq('is_paid', true)

  const totalDeposited = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0

  const { data: settings } = await adminSupabase
    .from('settings')
    .select('max_loan_multiplier, loan_interest_rate')
    .single()

  const maxLoan = totalDeposited * (settings?.max_loan_multiplier || 3)

  if (amount > maxLoan) {
    return {
      error: `Loan amount exceeds limit. Max allowed: ₹${maxLoan.toLocaleString('en-IN')} (3× your total deposits of ₹${totalDeposited.toLocaleString('en-IN')})`
    }
  }

  const { error } = await adminSupabase
    .from('loans')
    .insert({
      member_id: member.id,
      amount,
      interest_rate: settings?.loan_interest_rate || 2,
      reason,
      status: 'pending',
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/loans')
  return { success: true, message: 'Loan application submitted successfully' }
}

// Approve a loan
export async function approveLoan(loanId) {
  const supabase = createAdminClient()

  const today = new Date()
  const dueDate = new Date(today)
  dueDate.setMonth(dueDate.getMonth() + 12) // 12 month default term

  const { error } = await supabase
    .from('loans')
    .update({
      status: 'active',
      issued_at: today.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', loanId)

  if (error) return { error: error.message }

  // Log to transactions
  const { data: loan } = await supabase
    .from('loans')
    .select('member_id, amount')
    .eq('id', loanId)
    .single()

  if (loan) {
    await supabase.from('transactions').insert({
      member_id: loan.member_id,
      type: 'loan_issued',
      amount: loan.amount,
      direction: 'debit',
      reference_id: loanId,
      note: 'Loan approved and issued',
    })
  }

  revalidatePath('/dashboard/loans')
  return { success: true }
}

// Reject a loan
export async function rejectLoan(loanId) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('loans')
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', loanId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/loans')
  return { success: true }
}

// Record a repayment
export async function recordRepayment(formData) {
  const supabase = createAdminClient()

  const loanId = formData.get('loan_id')
  const amount = parseFloat(formData.get('amount'))
  const notes = formData.get('notes')

  if (!amount || amount <= 0) return { error: 'Invalid repayment amount' }


    const { data: loan } = await supabase
  .from('loans')
  .select('*, members!loans_member_id_fkey(name, phone)')
  .eq('id', loanId)
  .single()

  if (!loan) return { error: 'Loan not found' }

  const totalRepaid = loan.loan_repayments?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
  const outstanding = Number(loan.amount) - totalRepaid

  if (amount > outstanding) {
    return { error: `Amount exceeds outstanding balance of ₹${outstanding.toLocaleString('en-IN')}` }
  }

  // Insert repayment
  const { error: repayError } = await supabase
    .from('loan_repayments')
    .insert({ loan_id: loanId, amount, notes })

  if (repayError) return { error: repayError.message }

  // Log to transactions
  await supabase.from('transactions').insert({
    member_id: loan.member_id,
    type: 'loan_repayment',
    amount,
    direction: 'credit',
    reference_id: loanId,
    note: notes || 'Loan repayment',
  })

  // If fully paid, close the loan
  const newTotalRepaid = totalRepaid + amount
  if (newTotalRepaid >= Number(loan.amount)) {
    await supabase
      .from('loans')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', loanId)
  }

  revalidatePath('/dashboard/loans')
  return { success: true, message: 'Repayment recorded successfully' }
}