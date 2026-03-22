// app/dashboard/members/page.js
import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function MembersPage() {
  const supabase = createAdminClient()

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Members</h2>
          <p className="text-sm text-gray-400 mt-1">
            {members?.length || 0} total members
          </p>
        </div>
        <Link
          href="/dashboard/members/invite"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add member
        </Link>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">#</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Name</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Phone</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Role</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Joined</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {members?.map((member, index) => (
              <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-gray-400">{index + 1}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800">{member.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-600">{member.phone}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : member.role === 'auditor'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {new Date(member.join_date).toLocaleDateString('en-IN')}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/dashboard/members/${member.id}`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}

            {(!members || members.length === 0) && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  No members yet. Click "+ Add member" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}