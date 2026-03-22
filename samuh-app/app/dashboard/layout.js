// app/dashboard/layout.js
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }) {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await adminSupabase
    .from('members')
    .select('id, name, role')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar member={member} />
      {/* pt-14 on mobile to clear the fixed top bar */}
      <main className="flex-1 p-4 md:p-6 pt-20 md:pt-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}