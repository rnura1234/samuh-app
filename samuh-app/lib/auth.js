// lib/auth.js
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getActiveSamuh } from '@/lib/samuh'
import { redirect } from 'next/navigation'

// Use in any server component to get current user + samuh + member
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { samuh, member, isSuperAdmin, allSamuhs } = await getActiveSamuh(user.id)
  if (!samuh) redirect('/dashboard/samuhs')

  return { user, samuh, member, isSuperAdmin, allSamuhs }
}

// Use this in admin-only pages
export async function requireAdmin() {
  const { user, samuh, member, isSuperAdmin, allSamuhs } = await requireAuth()

  const isAdmin = member?.role === 'admin' || member?.role === 'super_admin' || isSuperAdmin

  if (!isAdmin) {
    redirect('/dashboard?error=unauthorized')
  }

  return { user, samuh, member, isSuperAdmin, allSamuhs }
}