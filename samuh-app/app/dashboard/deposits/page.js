// app/dashboard/deposits/page.js
import { createAdminClient } from '@/lib/supabase/server'
import MonthSelector from './MonthSelector'

export default async function DepositsPage({ searchParams }) {
  const supabase = createAdminClient()

  const params = await searchParams
  const currentMonth = parseInt(params.month) || new Date().getMonth() + 1
  const currentYear  = parseInt(params.year)  || new Date().getFullYear()

  const { data: members } = await supabase
    .from('members')
    .select('id, name, phone')
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  // Deposits for selected month
  const { data: deposits } = await supabase
    .from('deposits')
    .select('*')
    .eq('month', currentMonth)
    .eq('year', currentYear)

  // Active loans per member
  const { data: loans } = await supabase
    .from('loans')
    .select('id, member_id, amount, loan_repayments(amount)')
    .eq('status', 'active')

  // All repayments for this month
  const { data: repayments } = await supabase
    .from('loan_repayments')
    .select('*')
    .gte('paid_at', `${currentYear}-${String(currentMonth).padStart(2,'0')}-01`)
    .lt('paid_at',  `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-01`)

  const { data: settings } = await supabase
    .from('settings')
    .select('monthly_deposit_amount, loan_interest_rate, late_fee_per_day')
    .single()

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-gray-800">जमा / Deposits</h2>
        <p className="text-sm text-gray-400 mt-1">Enter monthly collection for each member</p>
      </div>

      <MonthSelector
        currentMonth={currentMonth}
        currentYear={currentYear}
        members={members || []}
        deposits={deposits || []}
        loans={loans || []}
        repayments={repayments || []}
        settings={settings}
      />
    </div>
  )
}