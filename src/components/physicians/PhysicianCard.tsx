// src/components/physicians/PhysicianCard.tsx
'use client'

import { MapPin, Building2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge }    from '@/components/ui/badge'
import { cn }       from '@/lib/utils'
import type { Physician } from '@/types'

interface PhysicianCardProps {
  physician:  Physician
  isSelected: boolean
  onToggle:   (id: string) => void
}

export function PhysicianCard({ physician, isSelected, onToggle }: PhysicianCardProps) {
  const { id, firstName, lastName, specialty, subSpecialty,
          affiliation, city, state, npi, npiRegistrationYear,
          acceptingPatients, boardCertified } = physician

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onToggle(id)}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(id) } }}
      className={cn(
        'relative cursor-pointer rounded-lg border bg-white p-4 transition-all duration-100',
        'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/20'
          : 'border-slate-200 hover:border-slate-300',
      )}
    >
      {/* ── Row 1: checkbox · name · board-certified badge ─────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          {/* Stop propagation so clicking the checkbox doesn't double-fire */}
          <div
            className="mt-0.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggle(id)}
              aria-label={`Select Dr. ${firstName} ${lastName}`}
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-900 leading-tight">
              Dr. {firstName} {lastName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {specialty}
              {subSpecialty && (
                <span className="text-slate-400"> · {subSpecialty}</span>
              )}
            </p>
          </div>
        </div>

        {boardCertified && (
          <Badge
            variant="secondary"
            className="shrink-0 bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] font-semibold px-1.5 py-0.5"
          >
            Board Certified
          </Badge>
        )}
      </div>

      {/* ── Row 2: location · affiliation ──────────────────────────────────── */}
      <div className="ml-7 mb-2.5 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
          <span>{city}, {state}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="truncate">{affiliation}</span>
        </div>
      </div>

      {/* ── Row 3: NPI · year · accepting-patients ──────────────────────────── */}
      <div className="ml-7 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-2">
        <span className="font-mono text-[10px] text-slate-400">
          NPI: {npi}
        </span>
        <span className="text-[10px] text-slate-400">
          Reg. {npiRegistrationYear}
        </span>
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
            acceptingPatients
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-500',
          )}
        >
          {acceptingPatients ? 'Accepting Patients' : 'Not Accepting'}
        </span>
      </div>
    </div>
  )
}
