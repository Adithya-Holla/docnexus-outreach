import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: string | number
  trend?: string
  icon?:  LucideIcon
}

export function MetricCard({ label, value, trend, icon: Icon }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </span>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50">
            <Icon className="h-4 w-4 text-blue-600" />
          </span>
        )}
      </div>

      <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>

      {trend && (
        <p className={cn(
          'text-[11px] font-medium',
          trend.startsWith('+') ? 'text-emerald-600' : 'text-slate-400',
        )}>
          {trend}
        </p>
      )}
    </div>
  )
}
