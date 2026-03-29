// app/dashboard/loans/LoanActions.js
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveLoan, rejectLoan } from '@/app/actions/loans'

export default function LoanActions({ loanId }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState(null)
  const [done, setDone] = useState(false)

  async function handleApprove() {
    if (!window.confirm('Approve this loan?')) return
    startTransition(async () => {
      const res = await approveLoan(loanId)
      if (res.error) {
        setMessage({ type: 'error', text: res.error })
      } else {
        setMessage({ type: 'success', text: 'Loan approved!' })
        setDone(true)
        setTimeout(() => router.refresh(), 1000)
      }
    })
  }

  async function handleReject() {
    if (!window.confirm('Reject this loan?')) return
    startTransition(async () => {
      const res = await rejectLoan(loanId)
      if (res.error) {
        setMessage({ type: 'error', text: res.error })
      } else {
        setMessage({ type: 'success', text: 'Loan rejected.' })
        setDone(true)
        setTimeout(() => router.refresh(), 1000)
      }
    })
  }

  if (done) {
    return (
      <span className={`text-xs px-3 py-1.5 rounded-lg ${
        message?.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
      }`}>
        {message?.text}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {message?.type === 'error' && (
        <span className="text-xs text-red-600">{message.text}</span>
      )}
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
      >
        {isPending ? '...' : 'Approve'}
      </button>
      <button
        onClick={handleReject}
        disabled={isPending}
        className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
      >
        {isPending ? '...' : 'Reject'}
      </button>
    </div>
  )
}