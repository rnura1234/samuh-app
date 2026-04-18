// app/dashboard/samuhs/CreateSamuhForm.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSamuh } from '@/app/actions/samuhs'

export default function CreateSamuhForm({ userId }) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [form, setForm] = useState({
    name:                   '',
    description:            '',
    monthly_deposit_amount: 1000,
    loan_interest_rate:     2,
    late_fee_per_day:       10,
    max_loan_multiplier:    3,
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    Object.entries(form).forEach(([k, v]) => formData.append(k, v))
    formData.append('userId', userId)

    const res = await createSamuh(formData)
    setLoading(false)
    setResult(res)

    if (res.success) {
      e.target.reset()
      setTimeout(() => router.push('/dashboard/samuhs'), 1500)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Samuh name *</label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Sharma Parivar Samuh"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Description</label>
          <input
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Monthly deposit (₹)</label>
          <input
            type="number"
            value={form.monthly_deposit_amount}
            onChange={e => setForm({ ...form, monthly_deposit_amount: e.target.value })}
            min="1"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Loan interest (% / month)</label>
          <input
            type="number"
            value={form.loan_interest_rate}
            onChange={e => setForm({ ...form, loan_interest_rate: e.target.value })}
            min="0"
            step="0.5"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Late fee (₹ / day)</label>
          <input
            type="number"
            value={form.late_fee_per_day}
            onChange={e => setForm({ ...form, late_fee_per_day: e.target.value })}
            min="0"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Max loan multiplier (×)</label>
          <input
            type="number"
            value={form.max_loan_multiplier}
            onChange={e => setForm({ ...form, max_loan_multiplier: e.target.value })}
            min="1"
            step="0.5"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {result?.error && (
        <p className="text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg">{result.error}</p>
      )}
      {result?.success && (
        <p className="text-sm bg-green-50 text-green-600 px-3 py-2 rounded-lg">
          Samuh created! Redirecting...
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Samuh'}
      </button>
    </form>
  )
}