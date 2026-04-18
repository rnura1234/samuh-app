// app/dashboard/members/invite/InviteForm.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addMemberToSamuh } from '@/app/actions/samuhs'

export default function InviteForm({ samuhId }) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData(e.target)
    formData.append('samuhId', samuhId)

    const res = await addMemberToSamuh(formData)
    setLoading(false)
    setResult(res)

    if (res.success) {
      e.target.reset()
      setTimeout(() => router.push('/dashboard/members'), 1500)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Full name *</label>
        <input name="name" type="text" placeholder="Ramesh Kumar" required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Phone number *</label>
        <input name="phone" type="tel" placeholder="9876543210" required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Email address *</label>
        <input name="email" type="email" placeholder="ramesh@example.com" required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Address</label>
        <input name="address" type="text" placeholder="Patna, Bihar"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Role</label>
        <select name="role"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="member">Member (Sadasya)</option>
          <option value="admin">Admin (Adhyaksh)</option>
          <option value="auditor">Auditor (read-only)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Temporary password *</label>
        <input name="password" type="password" placeholder="Min. 6 characters" minLength={6} required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        <p className="text-xs text-gray-400 mt-1">
          If this person is already in another Samuh, they will use their existing password.
        </p>
      </div>

      {result?.error && (
        <p className="text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg">{result.error}</p>
      )}
      {result?.success && (
        <p className="text-sm bg-green-50 text-green-600 px-3 py-2 rounded-lg">
          {result.message} — redirecting...
        </p>
      )}

      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
        {loading ? 'Adding...' : 'Add member'}
      </button>
    </form>
  )
}