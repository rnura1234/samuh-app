// app/actions/members.js
'use server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Admin client uses SERVICE ROLE key — can create users
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function inviteMember(formData) {
  const supabase = createClient()

  // Check the person doing this is actually an admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: adminMember } = await supabase
    .from('members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (adminMember?.role !== 'admin') {
    return { error: 'Only admins can invite members' }
  }

  const name     = formData.get('name')
  const phone    = formData.get('phone')
  const email    = formData.get('email')
  const address  = formData.get('address')
  const role     = formData.get('role') || 'member'
  const password = formData.get('password')

  // Basic validation
  if (!name || !phone || !email || !password) {
    return { error: 'Name, phone, email and password are required' }
  }

  const adminSupabase = getAdminClient()

  // Step 1: Create the auth user
  const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email confirmation
  })

  if (authError) return { error: authError.message }

  // Step 2: Insert into members table
  const { error: memberError } = await supabase
    .from('members')
    .insert({
      name,
      phone,
      address,
      role,
      user_id: newUser.user.id,
    })

  if (memberError) {
    // Rollback: delete the auth user if member insert fails
    await adminSupabase.auth.admin.deleteUser(newUser.user.id)
    return { error: memberError.message }
  }

  return { success: true, message: `${name} has been added successfully` }
}