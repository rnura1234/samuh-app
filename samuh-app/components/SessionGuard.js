// components/SessionGuard.js
'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SESSION_DURATION = 2 * 60 * 60 * 1000 // 2 hours in ms
const CHECK_INTERVAL   = 60 * 1000           // check every 1 minute

export default function SessionGuard() {
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()

    // ── Check session age every minute ──
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const loginTime   = session.user.last_sign_in_at
      const loginMs     = new Date(loginTime).getTime()
      const nowMs       = Date.now()
      const elapsedMs   = nowMs - loginMs

      if (elapsedMs >= SESSION_DURATION) {
        console.log('Session expired — logging out')
        await supabase.auth.signOut()
        router.push('/login?reason=timeout')
      }
    }, CHECK_INTERVAL)

    // ── Listen for auth state changes ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          if (!pathname.startsWith('/login')) {
            router.push('/login')
          }
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('Session token refreshed')
        }
      }
    )

    return () => {
      clearInterval(interval)
      subscription.unsubscribe()
    }
  }, [])

  return null
}