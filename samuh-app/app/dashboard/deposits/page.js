// app/dashboard/deposits/page.js
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import MonthSelector from './MonthSelector'

export default async function DepositsPage({ searchParams }) {
  const { samuh } = await requireAdmin()

  const params       = await searchParams
  const currentMonth = parseInt(params.month) || new Date().getMonth() + 1
  const currentYear  = parseInt(params.year)  || new Date().getFullYear()

  const supabase = createAdminClient()

  // Fetch active members of this samuh
  const { data: members } = await supabase
    .from('samuh_members')
    .select('id, name, phone, user_id')
    .eq('samuh_id', samuh.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  // Fetch deposits for this month scoped to samuh
  const { data: deposits } = await supabase
    .from('deposits')
    .select('*')
    .eq('samuh_id', samuh.id)
    .eq('month', currentMonth)
    .eq('year', currentYear)

    console.log("deports 11"+deposits)

  // Fetch active loans for this samuh with repayment totals
  const { data: loans } = await supabase
    .from('loans')
    .select('id, user_id, amount, interest_rate, loan_repayments(amount)')
    .eq('samuh_id', samuh.id)
    .eq('status', 'active')

  // Fetch repayments made this month for this samuh
  const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
  const nextMonth  = currentMonth === 12 ? 1 : currentMonth + 1
  const nextYear   = currentMonth === 12 ? currentYear + 1 : currentYear
  const monthEnd   = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const { data: repayments } = await supabase
    .from('loan_repayments')
    .select('*')
    .eq('samuh_id', samuh.id)
    .gte('paid_at', monthStart)
    .lt('paid_at', monthEnd)

  // Fetch samuh settings
  const { data: settings } = await supabase
    .from('samuhs')
    .select('monthly_deposit_amount, loan_interest_rate, late_fee_per_day')
    .eq('id', samuh.id)
    .single()

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-gray-800">जमा / Deposits</h2>
        <p className="text-sm text-gray-400 mt-1">
          Enter monthly collection for each member — {samuh.name}
        </p>
      </div>
      <MonthSelector
        currentMonth={currentMonth}
        currentYear={currentYear}
        members={members || []}
        deposits={deposits || []}
        loans={loans || []}
        repayments={repayments || []}
        settings={settings}
        samuhId={samuh.id}
      />
    </div>
  )
}