// components/layout/Sidebar.js
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LanguageToggle from '../ui/LanguageToggle'

const navItems = [
  { label: 'Dashboard',     href: '/dashboard' },
  { label: 'Members',       href: '/dashboard/members' },
  { label: 'Add member',    href: '/dashboard/members/invite', adminOnly: true },
  { label: 'Deposits',      href: '/dashboard/deposits' },
  { label: 'Loans',         href: '/dashboard/loans' },
  { label: 'Ledger',        href: '/dashboard/ledger' },
  { label: 'Dividend',      href: '/dashboard/ledger/dividend', adminOnly: true },
  { label: 'Reports',       href: '/dashboard/reports' },
]

export default function Sidebar({ member }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen]   = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavLinks = () => (
    <>
      {navItems.map(item => {
        if (item.adminOnly && member?.role !== 'admin') return null
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
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
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 bg-white border-r min-h-screen flex-col">
        <div className="px-5 py-5 border-b">
          <h1 className="text-lg font-semibold text-gray-800">Samuh</h1>
          <p className="text-xs text-gray-400">Group Manager</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLinks />
        </nav>
        <div className="px-4 py-4 border-t">
          <p className="text-sm font-medium text-gray-700 truncate">{member?.name || 'User'}</p>
          <p className="text-xs text-gray-400 capitalize mb-3">{member?.role || 'member'}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-red-500 hover:text-red-700 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-800">Samuh</h1>
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-600 p-1"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-30"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-white flex flex-col">
            <div className="px-5 py-5 border-b mt-14">
              <p className="text-sm font-medium text-gray-800">{member?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{member?.role}</p>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <NavLinks />
            </nav>
    
<div className="px-4 py-4 border-t">
  <p className="text-sm font-medium text-gray-700 truncate">{member?.name || 'User'}</p>
  <p className="text-xs text-gray-400 capitalize mb-2">{member?.role || 'member'}</p>
  <div className="flex items-center justify-between">
    <button
      onClick={handleLogout}
      className="text-xs text-red-500 hover:text-red-700 transition"
    >
      Sign out
    </button>
    <LanguageToggle />
  </div>
</div>
          </div>
        </div>
      )}
    </>
  )
}