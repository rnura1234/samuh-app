// components/layout/Sidebar.js
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Sidebar({ member, samuh, allSamuhs, isSuperAdmin }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen]             = useState(false)
  const [samuhOpen, setSamuhOpen]   = useState(false)

  const isAdmin      = member?.role === 'admin' || member?.role === 'super_admin' || isSuperAdmin
  const isSuperAdminUser = member?.role === 'super_admin' || isSuperAdmin

  const navItems = [
    { label: 'Dashboard',     href: '/dashboard' },
    { label: 'Members',       href: '/dashboard/members' },
    { label: 'Add member',    href: '/dashboard/members/invite', adminOnly: true },
    { label: 'Deposits',      href: '/dashboard/deposits',adminOnly:true },
    { label: 'Loans',         href: '/dashboard/loans' },
    { label: 'Ledger',        href: '/dashboard/ledger' },
    { label: 'Dividend',      href: '/dashboard/ledger/dividend', adminOnly: true },
    { label: 'Reports',       href: '/dashboard/reports' },
    { label: 'Manage Samuhs', href: '/dashboard/samuhs', superAdminOnly: true },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function switchSamuh(samuhId) {
    await fetch('/api/switch-samuh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ samuhId }),
    })
    setSamuhOpen(false)
    router.refresh()
  }

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map(item => {
        if (item.superAdminOnly && !isSuperAdminUser) return null
        if (item.adminOnly && !isAdmin) return null
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
    </nav>
  )

  const SamuhSwitcher = () => (
    <div className="px-3 py-3 border-b">
      <p className="text-xs text-gray-400 mb-1">Active Samuh</p>
      <button
        onClick={() => setSamuhOpen(!samuhOpen)}
        className="w-full flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 transition"
      >
        <span className="font-medium truncate">{samuh?.name || 'Select Samuh'}</span>
        <svg className={`w-4 h-4 shrink-0 transition-transform ${samuhOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="none">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {samuhOpen && allSamuhs?.length > 1 && (
        <div className="mt-1 bg-white border rounded-lg overflow-hidden shadow-sm">
          {allSamuhs.map(s => (
            <button
              key={s.id}
              onClick={() => switchSamuh(s.id)}
              className={`w-full text-left px-3 py-2 text-sm transition hover:bg-gray-50 ${
                s.id === samuh?.id ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
              }`}
            >
              {s.name}
              {s.myRole && (
                <span className="text-xs text-gray-400 ml-1">({s.myRole})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const UserInfo = () => (
    <div className="px-4 py-4 border-t">
      <p className="text-sm font-medium text-gray-700 truncate">
        {member?.name || 'User'}
      </p>
      <p className="text-xs text-gray-400 capitalize mb-3">
        {isSuperAdmin ? 'Super Admin' : member?.role}
      </p>
      <button
        onClick={handleLogout}
        className="text-xs text-red-500 hover:text-red-700 transition"
      >
        Sign out
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r min-h-screen flex-col">
        <div className="px-5 py-4 border-b">
          <h1 className="text-lg font-semibold text-gray-800">Samuh</h1>
          <p className="text-xs text-gray-400">Group Manager</p>
        </div>
        <SamuhSwitcher />
        <NavLinks />
        <UserInfo />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-gray-800">Samuh</h1>
          <p className="text-xs text-gray-400 truncate max-w-[160px]">{samuh?.name}</p>
        </div>
        <button onClick={() => setOpen(!open)} className="text-gray-600 p-1">
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

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black bg-opacity-30" onClick={() => setOpen(false)}/>
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-white flex flex-col">
            <div className="px-5 py-4 border-b mt-14">
              <p className="text-sm font-medium text-gray-800">{member?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{member?.role}</p>
            </div>
            <SamuhSwitcher />
            <NavLinks />
            <UserInfo />
          </div>
        </div>
      )}
    </>
  )
}