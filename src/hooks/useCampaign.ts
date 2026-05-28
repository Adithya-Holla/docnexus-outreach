'use client'

import { useState } from 'react'
import type { CreateCampaignInput } from '@/lib/validations'

export interface CampaignRecord {
  id:        string
  name:      string
  type:      string
  status:    string
  createdAt: string
  updatedAt: string
}

interface UseCampaignResult {
  saveDraft:      (data: CreateCampaignInput) => Promise<CampaignRecord | null>
  launchCampaign: (data: CreateCampaignInput, physicianIds: string[]) => Promise<CampaignRecord | null>
  isLoading:      boolean
  error:          string | null
}

export function useCampaign(): UseCampaignResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function postCampaign(data: CreateCampaignInput): Promise<CampaignRecord> {
    const res  = await fetch('/api/campaigns', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to create campaign')
    return json.data as CampaignRecord
  }

  async function saveDraft(data: CreateCampaignInput): Promise<CampaignRecord | null> {
    setIsLoading(true)
    setError(null)
    try {
      return await postCampaign(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  async function launchCampaign(
    data:         CreateCampaignInput,
    physicianIds: string[],
  ): Promise<CampaignRecord | null> {
    setIsLoading(true)
    setError(null)
    try {
      const campaign = await postCampaign(data)

      const res  = await fetch(`/api/campaigns/${campaign.id}/launch`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ physicianIds }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to launch campaign')
      return json.data as CampaignRecord
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { saveDraft, launchCampaign, isLoading, error }
}
