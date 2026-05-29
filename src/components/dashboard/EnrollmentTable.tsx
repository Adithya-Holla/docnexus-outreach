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
  enrollments: Enrollment[]
}

const STATUS_STYLES: Record<string, string> = {
  contacted: 'bg-blue-50  text-blue-700  border-blue-200',
  replied:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  bounced:   'bg-red-50   text-red-700   border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  contacted: 'Contacted',
  replied:   'Replied',
  bounced:   'Bounced',
}

export function EnrollmentTable({ enrollments }: Props) {
  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
        <p className="text-sm font-medium text-slate-500">No physicians enrolled yet</p>
        <p className="mt-1 text-xs text-slate-400">Launch the campaign to start enrolling physicians.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {['Name', 'Specialty', 'Affiliation', 'Status', 'Enrolled'].map((h) => (
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
              <td className="px-4 py-3 font-medium text-slate-900">
                Dr. {e.physician.firstName} {e.physician.lastName}
              </td>
              <td className="px-4 py-3 text-slate-600">{e.physician.specialty}</td>
              <td className="px-4 py-3 text-slate-600">{e.physician.affiliation}</td>
              <td className="px-4 py-3">
                <span className={cn(
                  'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                  STATUS_STYLES[e.status] ?? 'bg-slate-100 text-slate-600 border-slate-200',
                )}>
                  {STATUS_LABELS[e.status] ?? e.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(e.enrolledAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
