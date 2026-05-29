'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Users, Mail, SendHorizonal, Eye, MessageSquare, CalendarCheck, Trash2, TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EnrollmentTable } from '@/components/dashboard/EnrollmentTable'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import type { ChartDay, CampaignMetrics } from '@/lib/campaignAnalytics'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  enrollments: Enrollment[]
  analytics:   CampaignMetrics
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
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()

  const [campaign,   setCampaign]   = useState<Campaign | null>(null)
  const [isLoading,  setIsLoading]  = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const load = useCallback(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json() as Promise<{ data?: Campaign; error?: string }>)
      .then(({ data, error }) => {
        if (error || !data) { setError(error ?? 'Campaign not found'); return }
        setCampaign(data)
      })
      .catch(() => setError('Failed to load campaign'))
      .finally(() => setIsLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!confirm(`Delete "${campaign?.name}"? This cannot be undone.`)) return
    setIsDeleting(true)
    const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    if (res.ok) { router.push('/campaigns'); router.refresh() }
    else { setIsDeleting(false); alert('Delete failed. Please try again.') }
  }

  // Called by EnrollmentTable when user marks a status change
  function handleStatusChange(enrollmentId: string, newStatus: string) {
    setCampaign((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        enrollments: prev.enrollments.map((e) =>
          e.id === enrollmentId ? { ...e, status: newStatus } : e,
        ),
      }
    })
    // Reload analytics (counts changed)
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json() as Promise<{ data?: Campaign }>)
      .then(({ data }) => { if (data) setCampaign(data) })
      .catch(() => {/* soft fail */})
  }

  if (isLoading) return <LoadingSkeleton />

  if (error || !campaign) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">{error ?? 'Campaign not found'}</p>
      </div>
    )
  }

  const { analytics } = campaign
  const enrolled = campaign.enrollments.length

  return (
    <div className="overflow-y-auto h-full">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
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

        {/* ── Metrics ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          <div className="col-span-2 sm:col-span-1 xl:col-span-2">
            <MetricCard label="Enrolled"     value={enrolled}                icon={Users}          trend={`${campaign.enrollments.length} physician${enrolled !== 1 ? 's' : ''}`} />
          </div>
          <div className="col-span-2 sm:col-span-1 xl:col-span-2">
            <MetricCard label="Sent"         value={analytics.messagesSent}  icon={Mail} />
          </div>
          <div className="col-span-2 sm:col-span-1 xl:col-span-2">
            <MetricCard label="Delivered"    value={analytics.delivered}     icon={SendHorizonal} />
          </div>
          <div className="xl:col-span-2">
            <MetricCard label="Open Rate"    value={`${analytics.openRate}%`} icon={Eye}           trend={analytics.opened > 0 ? `${analytics.opened} unique opens` : 'No opens yet'} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Replies"        value={analytics.replied}       icon={MessageSquare}  trend={`${analytics.replyRate}% reply rate`} />
          <MetricCard label="Meetings"       value={analytics.meetingsBooked} icon={CalendarCheck}  trend={analytics.meetingsBooked > 0 ? 'booked via dashboard' : 'None yet'} />
          <MetricCard label="Bounced"        value={analytics.bounced}       icon={TrendingDown}   trend={`${analytics.bounceRate}% bounce rate`} />
          <MetricCard label="Reply Rate"     value={`${analytics.replyRate}%`} icon={MessageSquare} />
        </div>

        {/* ── Chart ────────────────────────────────────────────────────────── */}
        <ActivityChart data={analytics.chartData} />

        {/* ── Enrollment table ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-[13px] font-semibold text-slate-700">
            Enrolled Physicians
            <span className="ml-2 text-slate-400 font-normal">({enrolled})</span>
          </h2>
          <EnrollmentTable
            enrollments={campaign.enrollments}
            onStatusChange={handleStatusChange}
          />
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <Skeleton className="h-56 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}
