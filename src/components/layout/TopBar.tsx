'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Menu, LogOut } from 'lucide-react'
import type { SessionUser } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/auth'

function deriveTitle(pathname: string): string {
  if (pathname.startsWith('/physicians'))    return 'Physician Discovery'
  if (pathname === '/campaigns/new')         return 'Campaign Builder'
  if (/^\/campaigns\/[^/]+$/.test(pathname)) return 'Campaign Dashboard'
  if (pathname.startsWith('/campaigns'))     return 'Campaigns'
  return 'DocNexus'
}

interface TopBarProps {
  onMenuClick: () => void
  user:        SessionUser
}

export function TopBar({ onMenuClick, user }: TopBarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const title    = deriveTitle(pathname)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open sidebar"
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-[15px] font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 sm:inline-flex">
          Simulation Mode — Not for HCP Communication
        </span>

        {/* User identity */}
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-semibold text-slate-900 leading-tight">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">
              {ROLE_LABELS[user.role] ?? user.role} · {user.company}
            </p>
          </div>
          {/* Avatar initial */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[13px] font-bold text-white">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
