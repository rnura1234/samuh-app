// app/dashboard/loans/[id]/RepaymentForm.js
'use client'
import { useState, useTransition } from 'react'
import { recordRepayment } from '@/app/actions/loans'

export default function RepaymentForm({ loanId, outstanding }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setResult(null)
    const formData = new FormData(e.target)
    formData.append('loan_id', loanId)

    startTransition(async () => {
      const res = await recordRepayment(formData)
      setResult(res)
      if (res.success) e.target.reset()
    })
  }

  return (
    <div className="bg-white border rounded-xl p-5">
      <h3 className="font-medium text-gray-700 mb-4">Record repayment</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Amount (₹) — outstanding: ₹{outstanding.toLocaleString('en-IN')}
          </label>
          <input
            name="amount"
            type="number"
            min="1"
            max={outstanding}
            step="100"
            placeholder="Enter repayment amount"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
          <input
            name="notes"
            type="text"
            placeholder="e.g. Partial payment, cash"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {result?.error && (
          <p className="text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg">
            {result.error}
          </p>
        )}
        {result?.success && (
          <p className="text-sm bg-green-50 text-green-600 px-3 py-2 rounded-lg">
            {result.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isPending ? 'Recording...' : 'Record repayment'}
        </button>
      </form>
    </div>
  )
}