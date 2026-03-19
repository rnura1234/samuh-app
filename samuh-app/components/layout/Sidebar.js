// components/layout/Sidebar.js
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Dashboard',  href: '/dashboard' },
  { label: 'Members',    href: '/dashboard/members' },
  { label: 'Deposits',   href: '/dashboard/deposits' },
  { label: 'Loans',      href: '/dashboard/loans' },
  { label: 'Reports',    href: '/dashboard/reports' },
]

export default function Sidebar({ member }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 bg-white border-r min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b">
        <h1 className="text-lg font-semibold text-gray-800">Samuh</h1>
        <p className="text-xs text-gray-400">Group Manager</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          // Hide settings from non-admins
          if (item.adminOnly && member?.role !== 'admin') return null
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t">
        <p className="text-sm font-medium text-gray-700 truncate">
          {member?.name || 'User'}
        </p>
        <p className="text-xs text-gray-400 capitalize mb-3">
          {member?.role || 'member'}
        </p>
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs text-red-500 hover:text-red-700 transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}