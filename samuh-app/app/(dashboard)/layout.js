// app/(dashboard)/layout.js
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch member role from DB
  const { data: member } = await supabase
    .from('members')
    .select('id, name, role')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar member={member} />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}