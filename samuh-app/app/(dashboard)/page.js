// app/(dashboard)/page.js
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('members')
    .select('name, role')
    .eq('user_id', user.id)
    .single()

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">
        Welcome, {member?.name || 'there'}
      </h2>
      <p className="text-gray-400 text-sm">
        Samuh dashboard — more coming soon.
      </p>
    </div>
  )
}