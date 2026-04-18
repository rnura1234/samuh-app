// app/actions/samuhs.js
'use server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSamuh(formData) {
  const supabase = createAdminClient()

  const userId = formData.get('userId')

  // Verify super admin
  const { data: superAdmin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!superAdmin) return { error: 'Only super admins can create Samuhs' }

  const { data: samuh, error } = await supabase
    .from('samuhs')
    .insert({
      name:                   formData.get('name'),
      description:            formData.get('description'),
      created_by:             userId,
      monthly_deposit_amount: parseFloat(formData.get('monthly_deposit_amount')),
      loan_interest_rate:     parseFloat(formData.get('loan_interest_rate')),
      late_fee_per_day:       parseFloat(formData.get('late_fee_per_day')),
      max_loan_multiplier:    parseFloat(formData.get('max_loan_multiplier')),
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Auto-add creator as admin of this samuh
  await supabase
    .from('samuh_members')
    .insert({
      samuh_id: samuh.id,
      user_id:  userId,
      name:     'Super Admin',
      phone:    '0000000000',
      role:     'admin',
    })

  revalidatePath('/dashboard/samuhs')
  return { success: true, samuhId: samuh.id }
}

export async function addMemberToSamuh(formData) {
  const supabase = createAdminClient()

  const samuhId  = formData.get('samuhId')
  const email    = formData.get('email')
  const password = formData.get('password')
  const name     = formData.get('name')
  const phone    = formData.get('phone')
  const address  = formData.get('address')
  const role     = formData.get('role') || 'member'

  // Check if user already exists in auth
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  let authUser = existingUsers?.users?.find(u => u.email === email)

  if (!authUser) {
    // Create new auth user
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) return { error: authError.message }
    authUser = newUser.user
  }

  // Check if already member of this samuh
  const { data: existing } = await supabase
    .from('samuh_members')
    .select('id')
    .eq('samuh_id', samuhId)
    .eq('user_id', authUser.id)
    .single()

  if (existing) return { error: 'This person is already a member of this Samuh' }

  // Add to samuh_members
  const { error } = await supabase
    .from('samuh_members')
    .insert({
      samuh_id: samuhId,
      user_id:  authUser.id,
      name,
      phone,
      address,
      role,
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/members')
  return { success: true, message: `${name} added successfully` }
}