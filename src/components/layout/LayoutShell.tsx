// src/components/layout/LayoutShell.tsx
'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/**
 * Client wrapper that owns the mobile-sidebar open/close state.
 * Keeping state here (rather than in layout.tsx) lets layout.tsx remain a
 * Server Component while Sidebar and TopBar share the same boolean.
 */
export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Right column: TopBar + scrollable page content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}
