// src/app/physicians/page.tsx
'use client'

import { useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { FilterSidebar } from '@/components/physicians/FilterSidebar'
import { PhysicianGrid }  from '@/components/physicians/PhysicianGrid'
import { SelectionBar }   from '@/components/physicians/SelectionBar'
import { usePhysicians }  from '@/hooks/usePhysicians'
import { Skeleton }       from '@/components/ui/skeleton'
import type { FilterState } from '@/types'

/* ── Inner component uses useSearchParams — must be inside Suspense ─────────── */
function PhysiciansContent() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  /* Physician selection — local Set, not persisted to URL (too long for UUIDs) */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  /* Data ──────────────────────────────────────────────────────────────────── */
  const { data, isLoading, isError, refetch } = usePhysicians()

  /* Filter helpers ─────────────────────────────────────────────────────────── */
  const updateFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      value ? params.set(key, value) : params.delete(key)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, router],
  )

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [pathname, router])

  /* Selection helpers ─────────────────────────────────────────────────────── */
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  /* Pass selected IDs to campaigns/new via URL query string */
  const handleSaveToCampaign = useCallback(() => {
    const ids = Array.from(selectedIds).join(',')
    router.push(`/campaigns/new?ids=${ids}`)
  }, [selectedIds, router])

  /* Derive current filter values from URL for controlled inputs */
  const filters: FilterState = {
    specialty:   searchParams.get('specialty')   ?? '',
    state:       searchParams.get('state')       ?? '',
    affiliation: searchParams.get('affiliation') ?? '',
    yearFrom:    searchParams.get('yearFrom')    ?? '',
    yearTo:      searchParams.get('yearTo')      ?? '',
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-full bg-white">

      {/* Filter panel */}
      <FilterSidebar
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
      />

      {/* Main content area */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6 pb-24">

        {/* Stats header ── "X physicians · Y matching filters" */}
        <div className="mb-5 flex items-baseline gap-2">
          {data ? (
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">
                {data.total.toLocaleString()}
              </span>{' '}
              physicians in database
              {data.filtered !== data.total && (
                <>
                  {' '}·{' '}
                  <span className="font-semibold text-blue-600">
                    {data.filtered.toLocaleString()}
                  </span>{' '}
                  matching filters
                </>
              )}
            </p>
          ) : (
            <Skeleton className="h-4 w-64" />
          )}
        </div>

        {/* Grid */}
        <PhysicianGrid
          physicians={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
        />
      </div>

      {/* Selection bar slides up from bottom when count > 0 */}
      <SelectionBar
        selectedCount={selectedIds.size}
        onSaveToCampaign={handleSaveToCampaign}
      />
    </div>
  )
}

/* ── Page — Suspense required for useSearchParams inside client component ───── */
export default function PhysiciansPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Skeleton className="h-8 w-48" />
        </div>
      }
    >
      <PhysiciansContent />
    </Suspense>
  )
}
