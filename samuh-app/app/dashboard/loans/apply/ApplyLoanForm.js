// app/dashboard/loans/apply/ApplyLoanForm.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyLoan } from '@/app/actions/loans'

export default function ApplyLoanForm({
  totalDeposited, interestRate,
  samuhId, userId, disabled
}) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData(e.target)
    formData.append('samuh_id', samuhId)
    formData.append('user_id',  userId)

    const res = await applyLoan(formData)
    setLoading(false)
    setResult(res)

    if (res.success) {
      e.target.reset()
      setTimeout(() => router.push('/dashboard/loans'), 1500)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Loan amount (₹) *
        </label>
        <input
          name="amount"
          type="number"
          min="1"
          // max={maxLoan}
          // step="100"
          placeholder="e.g. 5000"
          required
          disabled={disabled}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
        {/* {maxLoan > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Maximum: ₹{maxLoan.toLocaleString('en-IN')}
          </p>
        )} */}
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Reason for loan *
        </label>
        <textarea
          name="reason"
          rows={3}
          placeholder="Briefly explain why you need this loan..."
          required
          disabled={disabled}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      {result?.error && (
        <p className="text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg">
          {result.error}
        </p>
      )}
      {result?.success && (
        <p className="text-sm bg-green-50 text-green-600 px-3 py-2 rounded-lg">
          {result.message} — redirecting...
        </p>
      )}

      <button
        type="submit"
        disabled={loading || disabled}
        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit loan application'}
      </button>
    </form>
  )
}