// app/dashboard/members/[id]/MemberActions.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MemberActions({ member }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState({
    name: member.name,
    phone: member.phone,
    address: member.address || '',
    role: member.role,
  })

  async function handleUpdate(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('members')
      .update({
        name: form.name,
        phone: form.phone,
        address: form.address,
        role: form.role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id)

    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Member updated successfully' })
      setEditing(false)
      router.refresh()
    }
  }

  async function handleToggleStatus() {
    const newStatus = member.status === 'active' ? 'inactive' : 'active'
    const confirmed = window.confirm(
      `Are you sure you want to ${newStatus === 'inactive' ? 'deactivate' : 'activate'} ${member.name}?`
    )
    if (!confirmed) return

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('members')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', member.id)

    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      router.refresh()
    }
  }

  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-700">Member actions</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-gray-600 transition"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={loading}
            className={`text-sm px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
              member.status === 'active'
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {member.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {editing && (
        <form onSubmit={handleUpdate} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Full name</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Address</label>
            <input
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="auditor">Auditor</option>
            </select>
          </div>

          {message && (
            <p className={`text-sm px-3 py-2 rounded-lg ${
              message.type === 'error'
                ? 'bg-red-50 text-red-600'
                : 'bg-green-50 text-green-600'
            }`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      )}
    </div>
  )
}