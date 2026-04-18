// app/no-samuh/page.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NoSamuhPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border rounded-2xl p-8 max-w-sm w-full text-center">

        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 6v8M14 18v2" stroke="#B45309" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="11" stroke="#B45309" strokeWidth="2"/>
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          No Samuh found
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          You are not part of any Samuh group yet.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
          <p className="text-xs font-medium text-gray-600 mb-2">You can:</p>
          <ul className="text-xs text-gray-500 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">1.</span>
              <span>Create your own Samuh group</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">2.</span>
              <span>Ask your group admin to add you as a member</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">3.</span>
              <span>Sign in with a different account</span>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <Link
            href="/register"
            className="block w-full bg-blue-600 text-white text-sm py-2.5 rounded-lg hover:bg-blue-700 transition text-center"
          >
            Create a new Samuh
          </Link>

          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full border text-sm py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            {loading ? 'Signing out...' : 'Sign in with different account'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Already added by admin? Try refreshing the page.
        </p>
        <button
          onClick={() => router.refresh()}
          className="text-xs text-blue-500 hover:underline mt-1"
        >
          Refresh
        </button>
      </div>
    </main>
  )
}