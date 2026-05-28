// src/hooks/usePhysicians.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { PhysiciansResponse } from '@/types'

export interface UsePhysiciansResult {
  data:      PhysiciansResponse | null
  isLoading: boolean
  isError:   boolean
  refetch:   () => void
}

/**
 * Reads filter params directly from the URL so a single source of truth
 * drives both the filter controls and the API request. When the URL changes
 * (filter selected, browser back button, etc.) the hook automatically
 * re-fetches without any extra wiring.
 */
export function usePhysicians(): UsePhysiciansResult {
  const searchParams = useSearchParams()

  const [data, setData]           = useState<PhysiciansResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]     = useState(false)

  // Stringify once so the callback identity only changes when params change
  const qsString = searchParams.toString()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const url = `/api/physicians${qsString ? `?${qsString}` : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: PhysiciansResponse = await res.json()
      setData(json)
    } catch (err) {
      console.error('[usePhysicians]', err)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qsString])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, isError, refetch: fetchData }
}
