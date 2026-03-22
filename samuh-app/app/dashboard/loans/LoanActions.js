// app/dashboard/loans/LoanActions.js
'use client'
import { useState, useTransition } from 'react'
import { approveLoan, rejectLoan } from '@/app/actions/loans'

export default function LoanActions({ loanId }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState(null)

  async function handleApprove() {
    startTransition(async () => {
      const res = await approveLoan(loanId)
      if (res.error) setMessage({ type: 'error', text: res.error })
    })
  }

  async function handleReject() {
    const confirmed = window.confirm('Are you sure you want to reject this loan?')
    if (!confirmed) return
    startTransition(async () => {
      const res = await rejectLoan(loanId)
      if (res.error) setMessage({ type: 'error', text: res.error })
    })
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className={`text-xs ${
          message.type === 'error' ? 'text-red-600' : 'text-green-600'
        }`}>
          {message.text}
        </span>
      )}
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={handleReject}
        disabled={isPending}
        className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  )
}