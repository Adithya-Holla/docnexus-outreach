'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import type { SessionUser } from '@/lib/auth'

interface Props {
  children: React.ReactNode
  user:     SessionUser
}

export function LayoutShell({ children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} user={user} />
        <main className="flex-1 overflow-hidden bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}
