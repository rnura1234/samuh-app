// app/dashboard/members/invite/page.js
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InviteForm from './InviteForm'

export default async function InviteMemberPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ✅ fetch role from YOUR members table, not from user object
  const { data: member, error } = await supabase
    .from('members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  console.log('member from DB:', member)        // should say { role: 'admin' }
  console.log('user.role from auth:', user.role) // always says 'authenticated' — ignore this

  // ✅ use member.role not user.role
  if (!member || member.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">Add new member</h2>
      <p className="text-gray-400 text-sm mb-6">
        Create a Samuh account for a new group member.
      </p>
      <InviteForm />
    </div>
  )
}