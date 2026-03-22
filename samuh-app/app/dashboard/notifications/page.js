// app/dashboard/notifications/page.js
import { createAdminClient } from '@/lib/supabase/server'
import NotificationActions from './NotificationActions'

export default async function NotificationsPage() {
  const supabase = createAdminClient()

  const currentMonth = new Date().getMonth() + 1
  const currentYear  = new Date().getFullYear()

  // Unpaid members this month
  const { data: members } = await supabase
    .from('members')
    .select('id, name, phone')
    .eq('status', 'active')

  const { data: paidDeposits } = await supabase
    .from('deposits')
    .select('member_id')
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .eq('is_paid', true)

  const paidIds      = new Set(paidDeposits?.map(d => d.member_id) || [])
  const unpaidMembers = members?.filter(m => !paidIds.has(m.id)) || []

  // Pending loans
  const { data: pendingLoans } = await supabase
    .from('loans')
    .select('id, amount, members(name)')
    .eq('status', 'pending')

  // Overdue loans (active loans past due date)
  const { data: overdueLoans } = await supabase
    .from('loans')
    .select('id, amount, due_date, members(name, phone)')
    .eq('status', 'active')
    .lt('due_date', new Date().toISOString().split('T')[0])

  // Fund balance
  const { data: deposits }   = await supabase.from('deposits').select('amount').eq('is_paid', true)
  const { data: activeLoans } = await supabase.from('loans').select('amount').eq('status', 'active')
  const { data: repayments }  = await supabase.from('loan_repayments').select('amount')

  const balance =
    (deposits?.reduce((s, d) => s + Number(d.amount), 0) || 0) -
    (activeLoans?.reduce((s, l) => s + Number(l.amount), 0) || 0) +
    (repayments?.reduce((s, r) => s + Number(r.amount), 0) || 0)

  const monthName = new Date(currentYear, currentMonth - 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Notifications</h2>
        <p className="text-sm text-gray-400 mt-1">
          Send SMS reminders and alerts to group members
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Unpaid this month</p>
          <p className="text-2xl font-semibold text-red-500">{unpaidMembers.length}</p>
          <p className="text-xs text-gray-400 mt-1">{monthName}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Overdue loans</p>
          <p className="text-2xl font-semibold text-amber-600">{overdueLoans?.length || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Past due date</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Fund balance</p>
          <p className={`text-2xl font-semibold ${balance < 5000 ? 'text-red-500' : 'text-green-600'}`}>
            ₹{balance.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {balance < 5000 ? 'Low — alert recommended' : 'Healthy'}
          </p>
        </div>
      </div>

      <NotificationActions
        unpaidMembers={unpaidMembers}
        overdueLoans={overdueLoans || []}
        balance={balance}
        monthName={monthName}
      />
    </div>
  )
}