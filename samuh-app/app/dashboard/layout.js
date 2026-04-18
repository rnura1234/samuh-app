// app/dashboard/layout.js
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveSamuh } from '@/lib/samuh'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { samuh, member, isSuperAdmin, allSamuhs } = await getActiveSamuh(user.id);
  console.log("samuh " , samuh);
  console.log("member", member, "isSuperAdmin" , isSuperAdmin );

  // No samuh yet — redirect to create or select
  console.log()
  if (!samuh && !isSuperAdmin) {
    redirect('/no-samuh')
  }

  if (!samuh && isSuperAdmin) {
    redirect('/dashboard/samuhs')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        member={member}
        samuh={samuh}
        allSamuhs={allSamuhs}
        isSuperAdmin={isSuperAdmin}
      />
      <main className="flex-1 p-4 md:p-6 pt-20 md:pt-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}