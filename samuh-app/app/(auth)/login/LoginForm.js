// app/(auth)/login/LoginForm.js
'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const reason       = searchParams.get('reason')

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(
    reason === 'timeout' ? 'Your session expired. Please sign in again.' : ''
  )
  const [currentUser,  setCurrentUser]  = useState(null)
  const [checkingUser, setCheckingUser] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      setCheckingUser(false)
    }
    checkSession()
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // If someone else is logged in, sign them out first
    if (currentUser) {
      await supabase.auth.signOut()
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    localStorage.setItem('samuh_login_time', Date.now().toString())
    router.push('/dashboard')
    router.refresh()
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setCurrentUser(null)
    setEmail('')
    setPassword('')
    setError('')
    router.refresh()
  }

  if (checkingUser) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl border w-full max-w-sm">

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            {currentUser ? 'Switch account' : 'Welcome back'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {currentUser
              ? 'Sign in with a different account'
              : 'Sign in to your Samuh account'}
          </p>
        </div>

        {/* Currently logged in banner */}
        {currentUser && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
            <p className="text-xs text-blue-500 mb-1">Currently signed in as</p>
            <p className="text-sm font-medium text-blue-800 truncate">
              {currentUser.email}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
              >
                Go to dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 text-xs border px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {currentUser && (
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100"/>
            <p className="text-xs text-gray-400">or sign in as someone else</p>
            <div className="flex-1 h-px bg-gray-100"/>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className={`text-sm px-3 py-2 rounded-lg ${
              reason === 'timeout'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-500'
            }`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading
              ? 'Signing in...'
              : currentUser
              ? 'Switch account'
              : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          New here?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Create your own Samuh
          </Link>
        </p>
      </div>
    </main>
  )
}