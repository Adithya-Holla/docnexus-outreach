// src/components/physicians/FilterSidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FilterState } from '@/types'

const SPECIALTIES = [
  'Oncology',
  'Cardiology',
  'Neurology',
  'Rheumatology',
  'Endocrinology',
  'Gastroenterology',
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

interface FilterSidebarProps {
  filters:        FilterState
  onFilterChange: (key: keyof FilterState, value: string) => void
  onClearFilters: () => void
}

const labelCls = 'block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5'
const inputCls = [
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2',
  'text-sm text-slate-900 placeholder-slate-400',
  'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')

export function FilterSidebar({ filters, onFilterChange, onClearFilters }: FilterSidebarProps) {
  // Text inputs commit to URL on blur/Enter to avoid per-keystroke API calls
  const [localAffiliation, setLocalAffiliation] = useState(filters.affiliation)
  const [localYearFrom,    setLocalYearFrom]    = useState(filters.yearFrom)
  const [localYearTo,      setLocalYearTo]      = useState(filters.yearTo)

  // Sync local state when the parent resets (e.g. "Clear all")
  useEffect(() => setLocalAffiliation(filters.affiliation), [filters.affiliation])
  useEffect(() => setLocalYearFrom(filters.yearFrom),       [filters.yearFrom])
  useEffect(() => setLocalYearTo(filters.yearTo),           [filters.yearTo])

  const hasActive = Object.values(filters).some(Boolean)

  const commitAffiliation = () => onFilterChange('affiliation', localAffiliation)
  const commitYearFrom    = () => onFilterChange('yearFrom',    localYearFrom)
  const commitYearTo      = () => onFilterChange('yearTo',      localYearTo)

  const onEnter = (commit: () => void) =>
    (e: React.KeyboardEvent) => { if (e.key === 'Enter') commit() }

  return (
    <aside className="sticky top-0 self-start w-64 shrink-0 border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Filters
          </span>
        </div>
        {hasActive && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-5 p-4">

        {/* Specialty */}
        <div>
          <label className={labelCls}>Specialty</label>
          <select
            value={filters.specialty}
            onChange={(e) => onFilterChange('specialty', e.target.value)}
            className={inputCls}
          >
            <option value="">All Specialties</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className={labelCls}>State</label>
          <select
            value={filters.state}
            onChange={(e) => onFilterChange('state', e.target.value)}
            className={inputCls}
          >
            <option value="">All States</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Affiliation */}
        <div>
          <label className={labelCls}>Affiliation</label>
          <input
            type="text"
            placeholder="e.g. Johns Hopkins"
            value={localAffiliation}
            onChange={(e) => setLocalAffiliation(e.target.value)}
            onBlur={commitAffiliation}
            onKeyDown={onEnter(commitAffiliation)}
            className={inputCls}
          />
        </div>

        {/* NPI Year Range */}
        <div>
          <label className={labelCls}>NPI Registration Year</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="From"
              min={1990}
              max={2030}
              value={localYearFrom}
              onChange={(e) => setLocalYearFrom(e.target.value)}
              onBlur={commitYearFrom}
              onKeyDown={onEnter(commitYearFrom)}
              className={cn(inputCls, '[appearance:textfield]')}
            />
            <span className="shrink-0 text-xs text-slate-400">–</span>
            <input
              type="number"
              placeholder="To"
              min={1990}
              max={2030}
              value={localYearTo}
              onChange={(e) => setLocalYearTo(e.target.value)}
              onBlur={commitYearTo}
              onKeyDown={onEnter(commitYearTo)}
              className={cn(inputCls, '[appearance:textfield]')}
            />
          </div>
        </div>

        {/* Explicit clear button at the bottom */}
        {hasActive && (
          <button
            onClick={onClearFilters}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </aside>
  )
}
