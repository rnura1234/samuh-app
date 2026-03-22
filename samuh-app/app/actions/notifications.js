// app/actions/notifications.js
'use server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  sendDepositReminder,
  sendLoanApprovedNotification,
  sendLowBalanceAlert,
} from '@/lib/notify'
import { revalidatePath } from 'next/cache'

// Send deposit reminders to all unpaid members this month
export async function sendDepositReminders() {
  const supabase = createAdminClient()

  const currentMonth = new Date().getMonth() + 1
  const currentYear  = new Date().getFullYear()
  const monthName    = new Date(currentYear, currentMonth - 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  // Get settings for deposit amount
  const { data: settings } = await supabase
    .from('settings')
    .select('monthly_deposit_amount')
    .single()

  const amount = settings?.monthly_deposit_amount || 500

  // Get all active members
  const { data: members } = await supabase
    .from('members')
    .select('id, name, phone')
    .eq('status', 'active')

  // Get who has already paid this month
  const { data: paidDeposits } = await supabase
    .from('deposits')
    .select('member_id')
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .eq('is_paid', true)

  const paidIds = new Set(paidDeposits?.map(d => d.member_id) || [])
  const unpaidMembers = members?.filter(m => !paidIds.has(m.id)) || []

  if (unpaidMembers.length === 0) {
    return { success: true, message: 'All members have paid this month!' }
  }

  // Send SMS to each unpaid member
  const results = await Promise.allSettled(
    unpaidMembers.map(member =>
      sendDepositReminder(member, amount, monthName)
    )
  )

  const sent    = results.filter(r => r.status === 'fulfilled' && r.value?.success).length
  const skipped = results.filter(r => r.value?.skipped).length
  const failed  = results.filter(r => r.status === 'rejected').length

  return {
    success: true,
    message: skipped > 0
      ? `MSG91 not configured. Would have sent to ${unpaidMembers.length} members.`
      : `Reminders sent to ${sent} members. Failed: ${failed}.`,
    unpaidMembers: unpaidMembers.map(m => m.name),
  }
}

// Send loan approved notification to a member
export async function notifyLoanApproved(loanId) {
  const supabase = createAdminClient()

  const { data: loan } = await supabase
    .from('loans')
    .select('*, members(name, phone)')
    .eq('id', loanId)
    .single()

  if (!loan) return { error: 'Loan not found' }

  const res = await sendLoanApprovedNotification(
    loan.members,
    loan.amount,
    loan.interest_rate
  )

  return res.skipped
    ? { success: true, message: 'MSG91 not configured — notification skipped' }
    : { success: true, message: `Notification sent to ${loan.members.name}` }
}

// Check fund balance and alert admin if low
export async function checkAndAlertLowBalance(threshold = 5000) {
  const supabase = createAdminClient()

  // Calculate fund balance
  const { data: deposits } = await supabase
    .from('deposits')
    .select('amount')
    .eq('is_paid', true)

  const { data: activeLoans } = await supabase
    .from('loans')
    .select('amount')
    .eq('status', 'active')

  const { data: repayments } = await supabase
    .from('loan_repayments')
    .select('amount')

  const totalDeposits   = deposits?.reduce((s, d) => s + Number(d.amount), 0) || 0
  const totalLoans      = activeLoans?.reduce((s, l) => s + Number(l.amount), 0) || 0
  const totalRepayments = repayments?.reduce((s, r) => s + Number(r.amount), 0) || 0
  const balance         = totalDeposits - totalLoans + totalRepayments

  if (balance > threshold) {
    return { success: true, message: `Balance is healthy: ₹${balance.toLocaleString('en-IN')}` }
  }

  // Get admin phone
  const { data: admin } = await supabase
    .from('members')
    .select('phone')
    .eq('role', 'admin')
    .single()

  if (!admin) return { error: 'No admin found' }

  const res = await sendLowBalanceAlert(admin.phone, balance)

  return res.skipped
    ? { success: true, message: `Low balance alert: ₹${balance.toLocaleString('en-IN')} — SMS skipped (MSG91 not configured)` }
    : { success: true, message: `Low balance alert sent! Balance: ₹${balance.toLocaleString('en-IN')}` }
}