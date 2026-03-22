// app/(dashboard)/members/invite/InviteForm.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { inviteMember } from '@/app/actions/members'

export default function InviteForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { success, error, message }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData(e.target)
    const res = await inviteMember(formData)

    setResult(res)
    setLoading(false)

    if (res.success) {
      e.target.reset()
      setTimeout(() => router.push('/dashboard/members'), 1500)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">

      {/* Name */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Full name *</label>
        <input
          name="name"
          type="text"
          placeholder="Ramesh Kumar"
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Phone number *</label>
        <input
          name="phone"
          type="tel"
          placeholder="9876543210"
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Email address *</label>
        <input
          name="email"
          type="email"
          placeholder="ramesh@example.com"
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Address</label>
        <input
          name="address"
          type="text"
          placeholder="Patna, Bihar"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Role</label>
        <select
          name="role"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="member">Member (Sadasya)</option>
          <option value="admin">Admin (Adhyaksh)</option>
          <option value="auditor">Auditor (read-only)</option>
        </select>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Temporary password *
        </label>
        <input
          name="password"
          type="password"
          placeholder="Min. 6 characters"
          minLength={6}
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          Share this with the member so they can log in.
        </p>
      </div>

      {/* Feedback */}
      {result?.error && (
        <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
          {result.error}
        </p>
      )}
      {result?.success && (
        <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
          {result.message} — redirecting...
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Add member'}
      </button>
    </form>
  )
}