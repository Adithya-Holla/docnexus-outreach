// src/components/layout/TopBar.tsx
'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

function deriveTitle(pathname: string): string {
  if (pathname.startsWith('/physicians'))    return 'Physician Discovery'
  if (pathname === '/campaigns/new')         return 'Campaign Builder'
  if (/^\/campaigns\/[^/]+$/.test(pathname)) return 'Campaign Dashboard'
  if (pathname.startsWith('/campaigns'))     return 'Campaigns'
  return 'DocNexus'
}

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname()
  const title    = deriveTitle(pathname)

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          aria-label="Open sidebar"
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-[15px] font-semibold text-slate-900">{title}</h1>
      </div>

      {/* Simulation disclaimer badge */}
      <span className="hidden rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 sm:inline-flex">
        Simulation Mode — Not for HCP Communication
      </span>
      {/* Abbreviated on very small screens */}
      <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800 sm:hidden">
        Simulation Mode
      </span>
    </header>
  )
}
