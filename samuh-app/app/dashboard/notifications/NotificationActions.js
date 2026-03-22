// app/dashboard/notifications/NotificationActions.js
'use client'
import { useState, useTransition } from 'react'
import {
  sendDepositReminders,
  checkAndAlertLowBalance,
} from '@/app/actions/notifications'

export default function NotificationActions({
  unpaidMembers, overdueLoans, balance, monthName
}) {
  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState({})

  async function handle(key, action) {
    startTransition(async () => {
      setResults(prev => ({ ...prev, [key]: { loading: true } }))
      const res = await action()
      setResults(prev => ({ ...prev, [key]: res }))
    })
  }

  const actions = [
    {
      key: 'deposit',
      title: 'Deposit reminders',
      desc: `Send SMS to ${unpaidMembers.length} unpaid members for ${monthName}`,
      members: unpaidMembers,
      disabled: unpaidMembers.length === 0,
      disabledMsg: 'All members have paid this month!',
      action: sendDepositReminders,
      color: 'blue',
    },
    {
      key: 'balance',
      title: 'Low balance alert',
      desc: `Current balance: ₹${balance.toLocaleString('en-IN')} — alert admin if below ₹5,000`,
      disabled: balance >= 5000,
      disabledMsg: 'Balance is healthy — no alert needed',
      action: checkAndAlertLowBalance,
      color: 'red',
    },
  ]

  return (
    <div className="space-y-4">
      {actions.map(item => (
        <div key={item.key} className="bg-white border rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-800">{item.title}</p>
              <p className="text-xs text-gray-400 mt-1">{item.desc}</p>

              {/* Unpaid member list */}
              {item.members && item.members.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.members.map(m => (
                    <span
                      key={m.id}
                      className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Result message */}
              {results[item.key] && !results[item.key].loading && (
                <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${
                  results[item.key].error
                    ? 'bg-red-50 text-red-600'
                    : 'bg-green-50 text-green-700'
                }`}>
                  {results[item.key].message || results[item.key].error}
                </div>
              )}

              {/* Disabled message */}
              {item.disabled && (
                <p className="mt-2 text-xs text-green-600">{item.disabledMsg}</p>
              )}
            </div>

            <button
              onClick={() => handle(item.key, item.action)}
              disabled={isPending || item.disabled}
              className={`ml-4 text-sm px-4 py-2 rounded-lg transition disabled:opacity-40 ${
                item.color === 'red'
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {results[item.key]?.loading ? 'Sending...' : 'Send SMS'}
            </button>
          </div>
        </div>
      ))}

      {/* Overdue loans section */}
      {overdueLoans.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl p-5">
          <p className="font-medium text-gray-800 mb-3">
            Overdue loans ({overdueLoans.length})
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-gray-400 font-normal">Member</th>
                <th className="text-left py-2 text-gray-400 font-normal">Amount</th>
                <th className="text-left py-2 text-gray-400 font-normal">Due date</th>
                <th className="text-left py-2 text-gray-400 font-normal">Days overdue</th>
              </tr>
            </thead>
            <tbody>
              {overdueLoans.map(loan => {
                const daysOverdue = Math.floor(
                  (new Date() - new Date(loan.due_date)) / (1000 * 60 * 60 * 24)
                )
                return (
                  <tr key={loan.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-800">
                      {loan.members?.name}
                    </td>
                    <td className="py-2 text-gray-700">
                      ₹{Number(loan.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(loan.due_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2 text-red-600 font-medium">
                      {daysOverdue} days
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MSG91 setup notice */}
      <div className="bg-gray-50 border border-dashed rounded-xl p-4">
        <p className="text-sm font-medium text-gray-600 mb-1">
          SMS setup required
        </p>
        <p className="text-xs text-gray-400">
          Add your MSG91 credentials to .env.local to enable real SMS sending.
          Without them, notifications are logged but not sent.
        </p>
        <code className="block mt-2 text-xs text-gray-500 bg-white border rounded p-2">
          MSG91_AUTH_KEY=your-key<br />
          MSG91_SENDER_ID=SAMUH<br />
          MSG91_DEPOSIT_TEMPLATE_ID=your-id
        </code>
      </div>
    </div>
  )
}