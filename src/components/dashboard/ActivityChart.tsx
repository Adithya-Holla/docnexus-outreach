'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

const MOCK_DATA = [
  { day: 'Mon', sent: 3  },
  { day: 'Tue', sent: 8  },
  { day: 'Wed', sent: 12 },
  { day: 'Thu', sent: 9  },
  { day: 'Fri', sent: 15 },
  { day: 'Sat', sent: 6  },
  { day: 'Sun', sent: 4  },
]

export function ActivityChart() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="mb-5 text-[13px] font-semibold text-slate-700">
        Outreach Activity (Last 7 Days)
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={MOCK_DATA} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,.08)',
            }}
            formatter={(v: number) => [v, 'Emails sent']}
          />
          <Bar dataKey="sent" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
