'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

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

interface Props {
  enrollments:    Enrollment[]
  onStatusChange: (enrollmentId: string, newStatus: string) => void
}

const STATUS_STYLES: Record<string, string> = {
  pending:        'bg-slate-100  text-slate-500   border-slate-200',
  contacted:      'bg-blue-50    text-blue-700    border-blue-200',
  opened:         'bg-purple-50  text-purple-700  border-purple-200',
  replied:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  bounced:        'bg-red-50     text-red-700     border-red-200',
  meeting_booked: 'bg-amber-50   text-amber-700   border-amber-200',
}

const STATUS_LABELS: Record<string, string> = {
  pending:        'Pending',
  contacted:      'Contacted',
  opened:         'Opened',
  replied:        'Replied',
  bounced:        'Bounced',
  meeting_booked: 'Meeting Booked',
}

// Higher = more advanced — never downgrade
const STATUS_RANK: Record<string, number> = {
  pending: 0, contacted: 1, opened: 2, bounced: 3, replied: 4, meeting_booked: 5,
}

function ActionButtons({
  enrollmentId,
  currentStatus,
  onStatusChange,
}: {
  enrollmentId:   string
  currentStatus:  string
  onStatusChange: (enrollmentId: string, newStatus: string) => void
}) {
  const [loading, setLoading] = useState<string | null>(null)

  async function fire(eventType: 'REPLIED' | 'MEETING_BOOKED') {
    setLoading(eventType)
    try {
      const res  = await fetch(`/api/enrollments/${enrollmentId}/events`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ eventType }),
      })
      const json = await res.json() as { data?: { status: string } }
      if (res.ok && json.data) onStatusChange(enrollmentId, json.data.status)
    } finally {
      setLoading(null)
    }
  }

  const rank = STATUS_RANK[currentStatus] ?? 0

  return (
    <div className="flex items-center gap-1.5">
      {rank < STATUS_RANK.replied && (
        <button
          onClick={() => fire('REPLIED')}
          disabled={!!loading}
          className="rounded border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
        >
          {loading === 'REPLIED' ? '…' : 'Replied'}
        </button>
      )}
      {rank < STATUS_RANK.meeting_booked && (
        <button
          onClick={() => fire('MEETING_BOOKED')}
          disabled={!!loading}
          className="rounded border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
        >
          {loading === 'MEETING_BOOKED' ? '…' : 'Book Meeting'}
        </button>
      )}
    </div>
  )
}

export function EnrollmentTable({ enrollments, onStatusChange }: Props) {
  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
        <p className="text-sm font-medium text-slate-500">No physicians enrolled yet</p>
        <p className="mt-1 text-xs text-slate-400">Launch the campaign to start enrolling physicians.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {['Name', 'Specialty', 'Affiliation', 'Status', 'Enrolled', 'Actions'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {enrollments.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                Dr. {e.physician.firstName} {e.physician.lastName}
              </td>
              <td className="px-4 py-3 text-slate-600">{e.physician.specialty}</td>
              <td className="px-4 py-3 text-slate-600">{e.physician.affiliation}</td>
              <td className="px-4 py-3">
                <span className={cn(
                  'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
                  STATUS_STYLES[e.status] ?? 'bg-slate-100 text-slate-600 border-slate-200',
                )}>
                  {STATUS_LABELS[e.status] ?? e.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                {new Date(e.enrolledAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </td>
              <td className="px-4 py-3">
                <ActionButtons
                  enrollmentId={e.id}
                  currentStatus={e.status}
                  onStatusChange={onStatusChange}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
