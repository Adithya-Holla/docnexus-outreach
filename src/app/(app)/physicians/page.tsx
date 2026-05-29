'use client'

import { useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { FilterSidebar } from '@/components/physicians/FilterSidebar'
import { PhysicianGrid }  from '@/components/physicians/PhysicianGrid'
import { SelectionBar }   from '@/components/physicians/SelectionBar'
import { usePhysicians }  from '@/hooks/usePhysicians'
import { Skeleton }       from '@/components/ui/skeleton'
import type { FilterState } from '@/types'

function PhysiciansContent() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const [selectedIds,      setSelectedIds]      = useState<Set<string>>(new Set())
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const { data, isLoading, isError, refetch } = usePhysicians()

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

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const existingCampaignId = searchParams.get('campaign')

  const handleSaveToCampaign = useCallback(() => {
    const ids = Array.from(selectedIds).join(',')
    if (existingCampaignId) {
      router.push(`/campaigns/${existingCampaignId}/edit?ids=${ids}`)
    } else {
      router.push(`/campaigns/new?ids=${ids}`)
    }
  }, [selectedIds, router, existingCampaignId])

  const filters: FilterState = {
    specialty:   searchParams.get('specialty')   ?? '',
    state:       searchParams.get('state')       ?? '',
    affiliation: searchParams.get('affiliation') ?? '',
    yearFrom:    searchParams.get('yearFrom')    ?? '',
    yearTo:      searchParams.get('yearTo')      ?? '',
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <div className="flex h-full bg-white">
      <FilterSidebar
        filters={filters}
        specialties={data?.specialties ?? []}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        mobileOpen={mobileFilterOpen}
        onMobileClose={() => setMobileFilterOpen(false)}
      />

      <div className="flex-1 min-w-0 overflow-y-auto p-4 pb-24 md:p-6 md:pb-24">

        {/* ── Mobile toolbar ─────────────────────────────────────────────── */}
        <div className="mb-4 flex items-center gap-3 md:mb-5">
          {/* Filter button — mobile only */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 md:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Physician count */}
          {data ? (
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{data.total.toLocaleString()}</span>{' '}
              physicians in database
              {data.filtered !== data.total && (
                <> ·{' '}
                  <span className="font-semibold text-blue-600">{data.filtered.toLocaleString()}</span>{' '}
                  matching filters
                </>
              )}
            </p>
          ) : (
            <Skeleton className="h-4 w-64" />
          )}
        </div>

        <PhysicianGrid
          physicians={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          onClearFilters={clearFilters}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
        />
      </div>

      <SelectionBar selectedCount={selectedIds.size} onSaveToCampaign={handleSaveToCampaign} />
    </div>
  )
}

export default function PhysiciansPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Skeleton className="h-8 w-48" /></div>}>
      <PhysiciansContent />
    </Suspense>
  )
}
