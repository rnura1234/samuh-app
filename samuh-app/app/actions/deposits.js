// app/actions/deposits.js
'use server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Generate deposit records for all active members for a given month/year
export async function generateMonthlyDeposits(month, year) {
  const supabase = createAdminClient()

  const { data: members } = await supabase
    .from('members')
    .select('id')
    .eq('status', 'active')

  if (!members || members.length === 0) return { error: 'No active members found' }

  // Get settings for deposit amount
  const { data: settings } = await supabase
    .from('settings')
    .select('monthly_deposit_amount')
    .single()

  const amount = settings?.monthly_deposit_amount || 500

  // Insert deposit record for each member (skip if already exists)
  const deposits = members.map(m => ({
    member_id: m.id,
    month,
    year,
    amount,
    is_paid: false,
  }))

  const { error } = await supabase
    .from('deposits')
    .upsert(deposits, { onConflict: 'member_id,month,year', ignoreDuplicates: true })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/deposits')
  return { success: true }
}

// Mark a deposit as paid
export async function markDepositPaid(depositId) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('deposits')
    .update({
      is_paid: true,
      paid_at: new Date().toISOString(),
    })
    .eq('id', depositId)

  if (error) return { error: error.message }

  // Log to transactions
  const { data: deposit } = await supabase
    .from('deposits')
    .select('member_id, amount')
    .eq('id', depositId)
    .single()

  if (deposit) {
    await supabase.from('transactions').insert({
      member_id: deposit.member_id,
      type: 'deposit',
      amount: deposit.amount,
      direction: 'credit',
      reference_id: depositId,
      note: 'Monthly deposit marked as paid',
    })
  }

  revalidatePath('/dashboard/deposits')
  return { success: true }
}

// Mark a deposit as unpaid
export async function markDepositUnpaid(depositId) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('deposits')
    .update({
      is_paid: false,
      paid_at: null,
    })
    .eq('id', depositId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/deposits')
  return { success: true }
}

// Apply late fee to an unpaid deposit
export async function applyLateFee(depositId, fee) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('deposits')
    .update({ late_fee: fee })
    .eq('id', depositId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/deposits')
  return { success: true }
}
// Add to app/actions/deposits.js

export async function saveMonthlyEntry({
  memberId, month, year, depositId,
  bachat, fine, otherFee,
  loanId, loanReturn, loanInterest, loanOtherFee,
}) {
  const supabase = createAdminClient()

  // ── Save deposit (saving section) ──
  const depositData = {
    member_id: memberId,
    month,
    year,
    amount:   bachat,
    late_fee: fine,
    is_paid:  bachat > 0,
    paid_at:  bachat > 0 ? new Date().toISOString() : null,
    notes:    otherFee > 0 ? `Other fee: ${otherFee}` : null,
  }

  if (depositId) {
    const { error } = await supabase
      .from('deposits')
      .update(depositData)
      .eq('id', depositId)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('deposits')
      .upsert(depositData, { onConflict: 'member_id,month,year' })
    if (error) return { error: error.message }
  }

  // Log saving to transactions
  if (bachat > 0) {
    const total = bachat + fine + otherFee
    await supabase.from('transactions').insert({
      member_id: memberId,
      type:      'deposit',
      amount:    total,
      direction: 'credit',
      note:      `Saving: ₹${bachat}, Fine: ₹${fine}, Other: ₹${otherFee}`,
    })
  }

  // ── Save loan repayment (loan section) ──
  if (loanId && loanReturn > 0) {
    const { error: repayError } = await supabase
      .from('loan_repayments')
      .insert({
        loan_id: loanId,
        amount:  loanReturn,
        notes:   `Interest: ₹${loanInterest}, Other: ₹${loanOtherFee}`,
        paid_at: new Date().toISOString(),
      })

    if (repayError) return { error: repayError.message }

    // Log loan repayment to transactions
    await supabase.from('transactions').insert({
      member_id: memberId,
      type:      'loan_repayment',
      amount:    loanReturn + loanInterest + loanOtherFee,
      direction: 'credit',
      reference_id: loanId,
      note: `Loan return: ₹${loanReturn}, Interest: ₹${loanInterest}, Other: ₹${loanOtherFee}`,
    })

    // Check if loan is fully paid — if so close it
    const { data: loan } = await supabase
      .from('loans')
      .select('amount, loan_repayments(amount)')
      .eq('id', loanId)
      .single()

    if (loan) {
      const totalRepaid = loan.loan_repayments
        .reduce((s, r) => s + Number(r.amount), 0)

      if (totalRepaid >= Number(loan.amount)) {
        await supabase
          .from('loans')
          .update({ status: 'closed', updated_at: new Date().toISOString() })
          .eq('id', loanId)
      }
    }
  }

  revalidatePath('/dashboard/deposits')
  return { success: true }
}