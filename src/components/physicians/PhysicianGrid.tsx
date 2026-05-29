// src/components/physicians/PhysicianGrid.tsx
'use client'

import { AlertCircle, RefreshCw, SearchX } from 'lucide-react'
import { Skeleton }      from '@/components/ui/skeleton'
import { Button }        from '@/components/ui/button'
import { PhysicianCard } from './PhysicianCard'
import type { Physician } from '@/types'

/* ── Card-shaped loading skeleton ──────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1">
          <Skeleton className="h-4 w-4 mt-0.5 rounded-sm shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-5 w-24 rounded-full shrink-0" />
      </div>
      <div className="ml-7 space-y-1.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-44" />
      </div>
      <div className="ml-7 flex gap-2 pt-2 border-t border-slate-100">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>
    </div>
  )
}

/* ── Props ──────────────────────────────────────────────────────────────────── */
interface PhysicianGridProps {
  physicians:        Physician[]
  isLoading:         boolean
  isError:           boolean
  onRetry:           () => void
  onClearFilters:    () => void
  selectedIds:       Set<string>
  onToggleSelection: (id: string) => void
}

export function PhysicianGrid({
  physicians,
  isLoading,
  isError,
  onRetry,
  onClearFilters,
  selectedIds,
  onToggleSelection,
}: PhysicianGridProps) {

  /* Loading ── 6 skeleton cards preserve the grid rhythm */
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    )
  }

  /* Error ── retry action so the user isn't stuck */
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
        <p className="font-semibold text-slate-700 mb-1">Failed to load physicians</p>
        <p className="text-sm text-slate-500 mb-5">
          Check your connection and try again.
        </p>
        <Button variant="default" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    )
  }

  /* Empty ── guide user to adjust filters */
  if (physicians.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <SearchX className="h-10 w-10 text-slate-300 mb-3" />
        <p className="font-semibold text-slate-600 mb-1">
          No physicians match your filters
        </p>
        <p className="text-sm text-slate-400 mb-5">
          Try adjusting your filters or clear them to see all physicians.
        </p>
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    )
  }

  /* Results grid */
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {physicians.map((p) => (
        <PhysicianCard
          key={p.id}
          physician={p}
          isSelected={selectedIds.has(p.id)}
          onToggle={onToggleSelection}
        />
      ))}
    </div>
  )
}
