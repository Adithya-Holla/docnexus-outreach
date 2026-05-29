'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { replaceTemplateVars, highlightTemplateVars } from '@/lib/templateEngine'
import type { Physician } from '@/types'
import type { CampaignFormValues } from '@/lib/validations'

type StepData = CampaignFormValues['sequences'][number]

interface PreviewPanelProps {
  sequences:       StepData[]
  physician:       Physician | null
  sender:          { name: string; email: string } | null
  physicianIndex?: number
  physicianCount?: number
  onPrev?:         () => void
  onNext?:         () => void
}

export function PreviewPanel({
  sequences, physician, sender,
  physicianIndex, physicianCount, onPrev, onNext,
}: PreviewPanelProps) {
  const [activeStep, setActiveStep] = useState(0)

  // Clamp activeStep when a step is deleted
  useEffect(() => {
    if (activeStep >= sequences.length) {
      setActiveStep(Math.max(0, sequences.length - 1))
    }
  }, [sequences.length, activeStep])

  const seq        = sequences[activeStep] ?? { subjectTemplate: '', bodyTemplate: '', delayDays: 0 }
  const rawSubject = seq.subjectTemplate.trim() || '(no subject yet)'
  const rawBody    = seq.bodyTemplate.trim()    || 'Start typing a message…'

  const resolvedSubject = physician ? replaceTemplateVars(rawSubject, physician) : null
  const resolvedBody    = physician ? replaceTemplateVars(rawBody,    physician) : null
  const hlSubject       = highlightTemplateVars(rawSubject)
  const hlBody          = highlightTemplateVars(rawBody)

  const stepLabel = activeStep === 0
    ? 'Initial'
    : `Follow-up ${activeStep}${seq.delayDays > 0 ? ` · Day +${seq.delayDays}` : ''}`

  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* ── Top bar: title + physician navigator ──────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Live Preview
        </span>

        {physicianCount && physicianCount > 1 && (
          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              onClick={onPrev}
              disabled={physicianIndex === 1}
              className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
              aria-label="Previous physician"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[36px] text-center text-[11px] font-medium tabular-nums text-slate-500">
              {physicianIndex} / {physicianCount}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={physicianIndex === physicianCount}
              className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
              aria-label="Next physician"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Step tabs ─────────────────────────────────────────────────── */}
      {sequences.length > 1 && (
        <div className="flex gap-0 overflow-x-auto border-b border-slate-200 bg-white px-3 pt-0">
          {sequences.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveStep(i)}
              className={cn(
                'shrink-0 border-b-2 px-3 py-2 text-[11px] font-medium transition-colors whitespace-nowrap',
                activeStep === i
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600',
              )}
            >
              {i === 0 ? 'Initial' : `Follow-up ${i}`}
              {i > 0 && s.delayDays > 0 && (
                <span className="ml-1 text-slate-300">+{s.delayDays}d</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Email chrome ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm text-[13px]">
          {/* Headers */}
          <div className="space-y-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <Row label="From">
              {sender ? (
                <span className="text-slate-700">{sender.name} &lt;{sender.email}&gt;</span>
              ) : (
                <em className="not-italic text-slate-400">No sender info</em>
              )}
            </Row>
            <Row label="To">
              {physician ? (
                <span className="text-slate-700">
                  Dr. {physician.firstName} {physician.lastName} &lt;{physician.email}&gt;
                </span>
              ) : (
                <em className="not-italic text-slate-400">Select physicians to personalise</em>
              )}
            </Row>
            <Row label="Subject">
              {resolvedSubject !== null ? (
                <span className="font-semibold text-slate-900">{resolvedSubject}</span>
              ) : (
                <span
                  className="font-semibold text-slate-900 [&_mark]:rounded [&_mark]:bg-amber-100 [&_mark]:px-0.5 [&_mark]:text-amber-800"
                  dangerouslySetInnerHTML={{ __html: hlSubject }}
                />
              )}
            </Row>
            <Row label="Step">
              <span className="text-slate-500">{stepLabel}</span>
            </Row>
          </div>

          {/* Body */}
          <div className="min-h-[200px] px-4 py-4">
            {resolvedBody !== null ? (
              <p className="whitespace-pre-wrap leading-relaxed text-slate-800">{resolvedBody}</p>
            ) : (
              <div
                className="whitespace-pre-wrap leading-relaxed text-slate-800 [&_mark]:rounded [&_mark]:bg-amber-100 [&_mark]:px-0.5 [&_mark]:text-amber-800"
                dangerouslySetInnerHTML={{ __html: hlBody }}
              />
            )}
          </div>
        </div>

        {!physician && (
          <p className="mt-3 text-center text-[11px] text-slate-400">
            Variables highlighted · select physicians for personalised output
          </p>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-14 shrink-0 font-medium text-slate-500">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  )
}
