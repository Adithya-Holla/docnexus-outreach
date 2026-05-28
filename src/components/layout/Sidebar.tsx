// src/components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Mail, BarChart2, Activity, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href:  string
  icon:  React.ElementType
  /** Returns true when this item should appear active for a given pathname. */
  isActive: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    label:    'Physicians',
    href:     '/physicians',
    icon:     Users,
    isActive: (p) => p.startsWith('/physicians'),
  },
  {
    label:    'Campaigns',
    href:     '/campaigns/new',
    icon:     Mail,
    // Active on /campaigns/new only — campaign detail pages belong to Dashboard
    isActive: (p) => p === '/campaigns/new',
  },
  {
    label:    'Dashboard',
    href:     '/campaigns',
    icon:     BarChart2,
    // Active on any /campaigns route that isn't the builder
    isActive: (p) => p.startsWith('/campaigns') && p !== '/campaigns/new',
  },
]

interface SidebarProps {
  isOpen:  boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Dark backdrop — mobile only, closes sidebar on tap */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-20 bg-black/50 transition-opacity duration-200 md:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          // Base layout — always a 240px vertical flex column
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-slate-900',
          // Mobile: slide in/out via transform
          'transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: re-join normal document flow, always visible
          'md:relative md:translate-x-0 md:inset-y-auto md:z-auto',
        )}
      >
        {/* ── Logo / wordmark ─────────────────────────────────────────────── */}
        <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-700/60 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-white">
              DocNexus
            </span>
          </div>

          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Navigation ──────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Platform
          </p>

          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ label, href, icon: Icon, isActive }) => {
              const active = isActive(pathname)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-700/60 px-5 py-3">
          <p className="text-[11px] text-slate-500">
            DocNexus Outreach Platform
          </p>
          <p className="text-[11px] text-slate-600">v1.0 · Summer 2026</p>
        </div>
      </aside>
    </>
  )
}
