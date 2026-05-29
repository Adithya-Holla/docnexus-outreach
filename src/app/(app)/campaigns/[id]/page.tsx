'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Users, Mail, Eye, MessageSquare, CalendarCheck, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EnrollmentTable } from '@/components/dashboard/EnrollmentTable'
import { ActivityChart } from '@/components/dashboard/ActivityChart'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SequenceStep {
  id:         string
  stepNumber: number
}

interface Enrollment {
  id:         string
  status:     string
  enrolledAt: string
  physician: {
    firstName:   string
    lastName:    string
    specialty:   string
    affiliation: string
  }
}

interface Campaign {
  id:          string
  name:        string
  type:        string
  status:      string
  createdAt:   string
  sequences:   SequenceStep[]
  enrollments: Enrollment[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function CampaignDashboardPage() {
  const { id }                            = useParams<{ id: string }>()
  const router                            = useRouter()
  const [campaign, setCampaign]           = useState<Campaign | null>(null)
  const [isLoading, setIsLoading]         = useState(true)
  const [isDeleting, setIsDeleting]       = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json() as Promise<{ data?: Campaign; error?: string }>)
      .then(({ data, error }) => {
        if (error || !data) { setError(error ?? 'Campaign not found'); return }
        setCampaign(data)
      })
      .catch(() => setError('Failed to load campaign'))
      .finally(() => setIsLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm(`Delete "${campaign?.name}"? This cannot be undone.`)) return
    setIsDeleting(true)
    const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/campaigns')
      router.refresh()
    } else {
      setIsDeleting(false)
      alert('Failed to delete campaign. Please try again.')
    }
  }

  if (isLoading) return <LoadingSkeleton />

  if (error || !campaign) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">{error ?? 'Campaign not found'}</p>
      </div>
    )
  }

  const enrolled     = campaign.enrollments.length
  const stepCount    = campaign.sequences.length
  const messagesSent = enrolled * stepCount
  const replies      = Math.floor(enrolled * 0.18)
  const meetings     = Math.floor(enrolled * 0.08)

  return (
    <div className="overflow-y-auto h-full">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{campaign.name}</h1>
            <span className={cn(
              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize',
              STATUS_BADGE[campaign.status] ?? 'bg-slate-100 text-slate-600',
            )}>
              {campaign.status}
            </span>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete campaign"
              className="ml-auto flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
          <p className="text-sm text-slate-400">
            {TYPE_LABELS[campaign.type] ?? campaign.type}
            {' · '}
            Created {new Date(campaign.createdAt).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </p>
        </div>

        {/* ── Metrics row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Physicians Enrolled" value={enrolled}      icon={Users}          trend={enrolled > 0 ? `${stepCount} step sequence` : undefined} />
          <MetricCard label="Messages Sent"        value={messagesSent} icon={Mail}           trend={enrolled > 0 ? `${stepCount} steps × ${enrolled}` : undefined} />
          <MetricCard label="Open Rate"            value="41.3%"        icon={Eye}            trend="+2.1% vs last campaign" />
          <MetricCard label="Replies"              value={replies}      icon={MessageSquare}  trend={enrolled > 0 ? `${Math.round(replies / Math.max(enrolled, 1) * 100)}% reply rate` : undefined} />
          <MetricCard label="Meetings Booked"      value={meetings}     icon={CalendarCheck}  trend={enrolled > 0 ? `${Math.round(meetings / Math.max(enrolled, 1) * 100)}% conversion` : undefined} />
        </div>

        {/* ── Chart + table ────────────────────────────────────────────────── */}
        <ActivityChart />

        <div className="space-y-3">
          <h2 className="text-[13px] font-semibold text-slate-700">
            Enrolled Physicians
            <span className="ml-2 text-slate-400 font-normal">({enrolled})</span>
          </h2>
          <EnrollmentTable enrollments={campaign.enrollments} />
        </div>

      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}
