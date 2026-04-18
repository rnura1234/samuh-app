import { requireAdmin } from '@/lib/auth'
import InviteForm from './InviteForm'

export default async function InviteMemberPage() {
  const { samuh } = await requireAdmin() // ✅ redirects if not admin

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">Add new member</h2>
      <p className="text-sm text-gray-400 mb-2">
        Adding to: <span className="text-blue-600 font-medium">{samuh?.name}</span>
      </p>
      <InviteForm samuhId={samuh.id} />
    </div>
  )
}