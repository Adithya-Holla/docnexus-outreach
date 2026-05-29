'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

interface Campaign {
  id:        string
  name:      string
  type:      string
  status:    string
  createdAt: string
  _count:    { enrollments: number; sequences: number }
}

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600',
  active:    'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
}

const TYPE_LABELS: Record<string, string> = {
  cold_outbound:       'Cold Outreach',
  reengagement:        'Re-engagement',
  conference_followup: 'Conference Follow-up',
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/campaigns')
      .then((r) => r.json() as Promise<{ data?: Campaign[] }>)
      .then(({ data }) => setCampaigns(data ?? []))
      .catch(() => {/* show empty state */})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="overflow-y-auto h-full">
      <div className="mx-auto max-w-4xl px-6 py-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Campaigns</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {isLoading ? '—' : `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 gap-1.5">
            <Link href="/campaigns/new">
              <Plus className="h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-20 text-center">
            <p className="text-sm font-medium text-slate-500">No campaigns yet</p>
            <p className="mt-1 text-xs text-slate-400 mb-4">Select physicians and create your first campaign.</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/physicians">Find Physicians</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/campaigns/${c.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-slate-900 truncate">{c.name}</span>
                    <span className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                      STATUS_BADGE[c.status] ?? 'bg-slate-100 text-slate-600',
                    )}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {TYPE_LABELS[c.type] ?? c.type}
                    {' · '}
                    {c._count.enrollments} physician{c._count.enrollments !== 1 ? 's' : ''}
                    {' · '}
                    {c._count.sequences} step{c._count.sequences !== 1 ? 's' : ''}
                    {' · '}
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
