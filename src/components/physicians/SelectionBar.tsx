// src/components/physicians/SelectionBar.tsx
'use client'

import { Users, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SelectionBarProps {
  selectedCount:    number
  onSaveToCampaign: () => void
}

export function SelectionBar({ selectedCount, onSaveToCampaign }: SelectionBarProps) {
  const visible   = selectedCount > 0
  const isDisabled = selectedCount === 0

  return (
    <div
      aria-live="polite"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:left-64',
        'transition-all duration-300 ease-in-out',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none',
      )}
    >
      <div className="border-t border-blue-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-6 py-3 md:px-8">
          {/* Left: count */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600">
              <Users className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              <span className="font-bold tabular-nums text-blue-600">
                {selectedCount}
              </span>{' '}
              {selectedCount === 1 ? 'physician' : 'physicians'} selected
            </p>
          </div>

          {/* Right: CTA */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onSaveToCampaign}
                disabled={isDisabled}
                className={cn(
                  'flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white',
                  'transition-colors hover:bg-blue-700 active:bg-blue-800',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                Save &amp; Add to Campaign
                <ArrowRight className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            {isDisabled && (
              <TooltipContent side="top">
                Select at least one physician
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
