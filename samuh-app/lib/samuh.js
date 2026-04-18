// lib/samuh.js
import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Get active samuh_id from cookie
export async function getActiveSamuhId() {
  const cookieStore = await cookies()
  return cookieStore.get('active_samuh_id')?.value || null
}

// Get all samuhs for a user
export async function getUserSamuhs(userId) {
  const supabase = createAdminClient()

  // Check if super admin
  const { data: superAdmin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (superAdmin) {
    // Super admin sees all samuhs
    const { data } = await supabase
      .from('samuhs')
      .select('*')
      .order('created_at', { ascending: false })
    return { samuhs: data || [], isSuperAdmin: true }
  }

  // Regular user — only their samuhs
  const { data: memberships } = await supabase
    .from('samuh_members')
    .select('samuh_id, role, samuhs(*)')
    .eq('user_id', userId)
    .eq('status', 'active')

  const samuhs = memberships?.map(m => ({
    ...m.samuhs,
    myRole: m.role,
  })) || []

  return { samuhs, isSuperAdmin: false }
}

// Get active samuh + current member info
export async function getActiveSamuh(userId) {
  const supabase   = createAdminClient()
  const samuhId    = await getActiveSamuhId()

  const { samuhs, isSuperAdmin } = await getUserSamuhs(userId)

  if (samuhs.length === 0) return { samuh: null, member: null, isSuperAdmin }

  // Pick active samuh or default to first
  const samuh = samuhs.find(s => s.id === samuhId) || samuhs[0]

  // Get member record for this samuh
  const { data: member } = await supabase
    .from('samuh_members')
    .select('*')
    .eq('samuh_id', samuh.id)
    .eq('user_id', userId)
    .single()

  return {
    samuh,
    member: member || (isSuperAdmin ? { role: 'super_admin', name: 'Super Admin' } : null),
    isSuperAdmin,
    allSamuhs: samuhs,
  }
}