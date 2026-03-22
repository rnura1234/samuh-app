// app/actions/members.js
'use server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function inviteMember(formData) {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  // Verify the caller is an admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: adminMember } = await adminSupabase
    .from('members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!adminMember || adminMember.role !== 'admin') {
    return { error: 'Only admins can invite members' }
  }

  const name     = formData.get('name')
  const phone    = formData.get('phone')
  const email    = formData.get('email')
  const address  = formData.get('address')
  const role     = formData.get('role') || 'member'
  const password = formData.get('password')

  if (!name || !phone || !email || !password) {
    return { error: 'Name, phone, email and password are required' }
  }

  // Step 1 — create auth user using admin client
  const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return { error: authError.message }

  // Step 2 — insert into members using admin client (bypasses RLS)
  const { error: memberError } = await adminSupabase
    .from('members')
    .insert({
      name,
      phone,
      address,
      role,
      user_id: newUser.user.id,
    })

  if (memberError) {
    // Rollback auth user if member insert fails
    await adminSupabase.auth.admin.deleteUser(newUser.user.id)
    return { error: memberError.message }
  }

  return { success: true, message: `${name} has been added successfully` }
}