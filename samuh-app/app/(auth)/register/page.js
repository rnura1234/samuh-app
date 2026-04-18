'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const STEPS = ['Account', 'Samuh details']

export default function RegisterPage() {
  const router  = useRouter()
  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const [account, setAccount] = useState({
    name:     '',
    phone:    '',
    email:    '',
    password: '',
    confirm:  '',
  })

  const [samuhDetails, setSamuhDetails] = useState({
    samuhName:              '',
    description:            '',
    monthly_deposit_amount: 1000,
    loan_interest_rate:     2,
    late_fee_per_day:       10,
    max_loan_multiplier:    3,
  })

  async function handleRegister() {
  setLoading(true)
  setError('')

  const supabase = createClient()

  // Step 1 — create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email:    account.email,
    password: account.password,
  })

  if (authError) {
    setError(authError.message)
    setLoading(false)
    return
  }

  // Step 2 — create samuh via API
  let res, data

  try {
    res = await fetch('/api/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:                 authData.user.id,
        name:                   account.name,
        phone:                  account.phone,
        samuhName:              samuhDetails.samuhName,
        description:            samuhDetails.description,
        monthly_deposit_amount: samuhDetails.monthly_deposit_amount,
        loan_interest_rate:     samuhDetails.loan_interest_rate,
        late_fee_per_day:       samuhDetails.late_fee_per_day,
        max_loan_multiplier:    samuhDetails.max_loan_multiplier,
      }),
    })

    const text = await res.text()
    console.log('API response status:', res.status)
    console.log('API response body:', text)

    data = text ? JSON.parse(text) : {}

  } catch (err) {
    setError('Server error: ' + err.message)
    setLoading(false)
    return
  }

  if (!res.ok || data.error) {
    setError(data.error || 'Something went wrong')
    setLoading(false)
    return
  }

  // Step 3 — sign in after registration
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email:    account.email,
    password: account.password,
  })

  if (signInError) {
    setError('Account created! Please sign in manually.')
    setLoading(false)
    router.push('/login')
    return
  }

  // Step 4 — set active samuh cookie
  await fetch('/api/switch-samuh', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ samuhId: data.samuhId }),
  })

  router.push('/dashboard')
  router.refresh()
}

  function handleNext(e) {
    e.preventDefault()
    setError('')

    if (step === 0) {
      if (!account.name || !account.phone || !account.email || !account.password) {
        setError('All fields are required')
        return
      }
      if (account.password !== account.confirm) {
        setError('Passwords do not match')
        return
      }
      if (account.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      setStep(1)
    } else {
      if (!samuhDetails.samuhName) {
        setError('Samuh name is required')
        return
      }
      handleRegister()
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="bg-white border rounded-2xl p-8 w-full max-w-md">

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Create your Samuh</h2>
          <p className="text-sm text-gray-400 mt-1">Set up your group in 2 simple steps</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition ${
                i < step  ? 'bg-green-500 text-white' :
                i === step ? 'bg-blue-600 text-white'  :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleNext} className="space-y-4">

          {/* Step 0 — Account */}
          {step === 0 && (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full name *</label>
                <input
                  value={account.name}
                  onChange={e => setAccount({ ...account, name: e.target.value })}
                  placeholder="Ramesh Kumar"
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone number *</label>
                <input
                  value={account.phone}
                  onChange={e => setAccount({ ...account, phone: e.target.value })}
                  placeholder="9876543210"
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email address *</label>
                <input
                  type="email"
                  value={account.email}
                  onChange={e => setAccount({ ...account, email: e.target.value })}
                  placeholder="ramesh@example.com"
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Password *</label>
                <input
                  type="password"
                  value={account.password}
                  onChange={e => setAccount({ ...account, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Confirm password *</label>
                <input
                  type="password"
                  value={account.confirm}
                  onChange={e => setAccount({ ...account, confirm: e.target.value })}
                  placeholder="Repeat password"
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Step 1 — Samuh details */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Samuh name *</label>
                <input
                  value={samuhDetails.samuhName}
                  onChange={e => setSamuhDetails({ ...samuhDetails, samuhName: e.target.value })}
                  placeholder="e.g. Sharma Parivar Samuh"
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description (optional)</label>
                <input
                  value={samuhDetails.description}
                  onChange={e => setSamuhDetails({ ...samuhDetails, description: e.target.value })}
                  placeholder="Short description of your group"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Monthly deposit (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={samuhDetails.monthly_deposit_amount}
                    onChange={e => setSamuhDetails({ ...samuhDetails, monthly_deposit_amount: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Interest (% / month)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={samuhDetails.loan_interest_rate}
                    onChange={e => setSamuhDetails({ ...samuhDetails, loan_interest_rate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Late fee (₹ / day)</label>
                  <input
                    type="number"
                    min="0"
                    value={samuhDetails.late_fee_per_day}
                    onChange={e => setSamuhDetails({ ...samuhDetails, late_fee_per_day: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max loan (× deposits)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={samuhDetails.max_loan_multiplier}
                    onChange={e => setSamuhDetails({ ...samuhDetails, max_loan_multiplier: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs text-blue-700 font-medium mb-1">You will be the admin</p>
                <p className="text-xs text-blue-600">
                  You can change these settings later and add members after setup.
                </p>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => { setStep(step - 1); setError('') }}
                className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                ← Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Setting up...' : step === 0 ? 'Next →' : 'Create Samuh'}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  )
}