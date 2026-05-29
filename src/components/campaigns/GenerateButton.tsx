'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
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
  const [toastMsg,  setToastMsg]  = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }

  async function handleClick() {
    if (isLoading) return

    if (!physician) {
      showToast('Select at least one physician to personalise the email.')
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
        showToast(json.error ?? 'Generation failed. Please try again.')
        return
      }

      onGenerated(json.subject, json.body)
    } catch {
      showToast('Network error. Check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
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

      {toastMsg && (
        <div className="absolute bottom-full left-0 mb-2 w-64 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 shadow-md">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
