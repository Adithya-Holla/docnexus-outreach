'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Physician } from '@/types'

interface Props {
  physician:    Physician | null
  campaignType: string
  stepNumber:   number
  sender:       { name: string; title: string; company: string }
  onGenerated:  (subject: string, body: string) => void
}

export function GenerateButton({ physician, campaignType, stepNumber, sender, onGenerated }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    if (isLoading) return

    if (!physician) {
      toast({
        title:    'No physician selected',
        description: 'Select at least one physician to personalise the email.',
        variant:  'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const res  = await fetch('/api/ai/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ physician, campaignType, stepNumber, sender }),
      })
      const json = await res.json() as { subject?: string; body?: string; error?: string }

      if (!res.ok || !json.subject || !json.body) {
        toast({
          title:    'AI generation failed',
          description: json.error ?? 'Please try again.',
          variant:  'destructive',
        })
        return
      }

      onGenerated(json.subject, json.body)
    } catch {
      toast({
        title:    'Network error',
        description: 'Check your connection and try again.',
        variant:  'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      title={physician ? 'Generate email with AI' : 'Select a physician first'}
      className="flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading
        ? <Loader2 className="h-3 w-3 animate-spin" />
        : <Sparkles className="h-3 w-3" />
      }
      {isLoading ? 'Generating…' : 'Generate with AI'}
    </button>
  )
}
