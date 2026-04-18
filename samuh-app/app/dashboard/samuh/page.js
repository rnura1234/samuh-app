// app/dashboard/samuhs/page.js
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreateSamuhForm from './CreateSamuhForm'
import Link from 'next/link'

export default async function ManageSamuhs() {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only super admins
  const { data: superAdmin } = await adminSupabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!superAdmin) redirect('/dashboard')

  const { data: samuhs } = await adminSupabase
    .from('samuhs')
    .select(`
      *,
      samuh_members(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Manage Samuhs</h2>
        <p className="text-sm text-gray-400 mt-1">
          Create and manage group Samuhs
        </p>
      </div>

      {/* Existing samuhs */}
      {samuhs && samuhs.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b bg-gray-50">
            <p className="text-sm font-medium text-gray-700">
              All Samuhs ({samuhs.length})
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Name</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Members</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Deposit/month</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Interest</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Created</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {samuhs.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {s.samuh_members?.[0]?.count || 0}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    ₹{Number(s.monthly_deposit_amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{s.loan_interest_rate}%</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(s.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/samuhs/${s.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create new samuh */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Create new Samuh</h3>
        <CreateSamuhForm userId={user.id} />
      </div>
    </div>
  )
}