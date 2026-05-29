'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { ChartDay } from '@/lib/campaignAnalytics'

interface Props {
  data: ChartDay[]
}

export function ActivityChart({ data }: Props) {
  const hasActivity = data.some((d) => d.sent > 0)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-slate-700">
          Outreach Activity (Last 7 Days)
        </h3>
        {!hasActivity && (
          <span className="text-[11px] text-slate-400">No dispatches in this window</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
