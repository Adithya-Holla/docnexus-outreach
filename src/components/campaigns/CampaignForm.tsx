'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Plus, Rocket, Save, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { CreateCampaignSchema, type CampaignFormValues } from '@/lib/validations'
import { useCampaign } from '@/hooks/useCampaign'
import { SequenceStep } from './SequenceStep'
import { PreviewPanel } from './PreviewPanel'
import type { Physician, PhysiciansResponse } from '@/types'
import type { SessionUser } from '@/lib/auth'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS    = ['Campaign Details', 'Outreach Sequence', 'Review & Launch'] as const
const inputCls = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500'

const TYPE_OPTIONS = [
  { value: 'cold_outbound',       label: 'Cold Outreach' },
  { value: 'reengagement',        label: 'Re-engagement' },
  { value: 'conference_followup', label: 'Conference Follow-up' },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  physicianIds:  string[]
  user:          SessionUser
  campaignId?:   string
  initialValues?: CampaignFormValues
}

export function CampaignForm({ physicianIds, user, campaignId, initialValues }: Props) {
  const router  = useRouter()
  const [step, setStep]                         = useState<1 | 2 | 3>(1)
  const [previewPhysicians, setPreviewPhysicians] = useState<Physician[]>([])
  const [previewIdx, setPreviewIdx]               = useState(0)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
  const { saveDraft, launchCampaign, updateDraft, updateAndLaunch, isLoading, error } = useCampaign()

  // Fetch ALL selected physicians for the preview carousel — no dedicated endpoint, filter client-side
  useEffect(() => {
    if (physicianIds.length === 0) return
    fetch('/api/physicians')
      .then((r) => r.json() as Promise<PhysiciansResponse>)
      .then(({ data }) => {
        // Preserve the selection order the user chose on the discovery page
        const ordered = physicianIds
          .map((id) => data.find((p) => p.id === id))
          .filter((p): p is Physician => p !== undefined)
        setPreviewPhysicians(ordered)
      })
      .catch(() => {/* preview degrades gracefully */})
  }, [physicianIds])

  const formDefaults: CampaignFormValues = initialValues ?? {
    name:      '',
    type:      'cold_outbound',
    sequences: [
      { stepNumber: 1, delayDays: 0, subjectTemplate: '', bodyTemplate: '' },
      { stepNumber: 2, delayDays: 7, subjectTemplate: '', bodyTemplate: '' },
    ],
  }

  const form = useForm<CampaignFormValues>({
    resolver:      zodResolver(CreateCampaignSchema),
    mode:          'onBlur',
    defaultValues: formDefaults,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'sequences' })
  const { errors }                  = form.formState

  // Watch entire sequences array and type so the preview panel and AI button stay in sync
  const sequences    = form.watch('sequences')
  const campaignType = form.watch('type')

  // After a deletion, re-number stepNumbers so they stay sequential.
  // Values are preserved by useFieldArray.remove(); only the metadata needs fixing.
  const prevLengthRef = useRef(fields.length)
  useEffect(() => {
    if (fields.length !== prevLengthRef.current) {
      prevLengthRef.current = fields.length
      fields.forEach((_, idx) => {
        form.setValue(`sequences.${idx}.stepNumber` as never, (idx + 1) as never)
      })
    }
  }, [fields, form])

  async function advance() {
    const ok = step === 1
      ? await form.trigger(['name', 'type'])
      : await form.trigger('sequences')
    if (!ok) {
      toast({
        title:       'Fix validation errors',
        description: 'Please complete all required fields before continuing.',
        variant:     'destructive',
      })
    }
    if (ok) setStep((s) => (s + 1) as typeof step)
  }

  async function handleSaveDraft() {
    const ok = await form.trigger()
    if (!ok) {
      toast({
        title:       'Fix validation errors',
        description: 'Please complete all required fields before saving.',
        variant:     'destructive',
      })
      return
    }
    const values = form.getValues()
    const c = campaignId
      ? await updateDraft(campaignId, values)
      : await saveDraft(values)
    if (c) {
      toast({ title: 'Campaign saved', description: 'Your draft has been saved.' })
      router.push(campaignId ? `/campaigns/${campaignId}` : '/campaigns')
    }
  }

  async function handleLaunch() {
    const ok = await form.trigger()
    if (!ok) {
      toast({
        title:       'Fix validation errors',
        description: 'Please complete all required fields before launching.',
        variant:     'destructive',
      })
      return
    }
    const values = form.getValues()
    const c = campaignId
      ? await updateAndLaunch(campaignId, values, physicianIds)
      : await launchCampaign(values, physicianIds)
    if (c) {
      toast({
        title:       'Campaign launched',
        description: 'Emails are being sent to enrolled physicians.',
      })
      router.push('/campaigns')
    }
  }

  return (
    <div className="flex h-full">

      {/* ── Main column ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 pb-24 pt-6">

          <StepIndicator current={step} />

          {/* Step 1 ── Campaign Details */}
          {step === 1 && (
            <div className="mt-8 space-y-5">
              <div>
                <label className={labelCls}>Campaign Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology Q3 Outreach"
                  className={cn(inputCls, errors.name && 'border-red-400')}
                  {...form.register('name')}
                />
                {errors.name?.message && (
                  <p className="mt-1 text-[11px] text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Campaign Type *</label>
                <select className={inputCls} {...form.register('type')}>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {physicianIds.length > 0 && (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <span className="font-semibold">{physicianIds.length}</span>{' '}
                  {physicianIds.length === 1 ? 'physician' : 'physicians'} queued for this campaign.
                </div>
              )}
            </div>
          )}

          {/* Step 2 ── Outreach Sequence */}
          {step === 2 && (
            <div className="mt-8 space-y-4">
              {fields.map((field, idx) => (
                <SequenceStep
                  key={field.id}
                  index={idx}
                  control={form.control}
                  onRemove={() => remove(idx)}
                  canRemove={fields.length > 1}
                  physician={previewPhysicians[previewIdx] ?? null}
                  campaignType={campaignType}
                  sender={{ name: `${user.firstName} ${user.lastName}`, title: user.title, company: user.company }}
                />
              ))}

              <button
                type="button"
                onClick={() =>
                  append({
                    stepNumber:      fields.length + 1,
                    delayDays:       7,
                    subjectTemplate: '',
                    bodyTemplate:    '',
                  })
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600"
              >
                <Plus className="h-4 w-4" />
                Add Follow-up Step
              </button>

              {/* Mobile preview toggle — only on screens narrower than lg */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobilePreviewOpen((v) => !v)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {mobilePreviewOpen
                    ? <><EyeOff className="h-4 w-4" /> Hide Preview</>
                    : <><Eye    className="h-4 w-4" /> Show Preview</>
                  }
                </button>
                {mobilePreviewOpen && (
                  <div className="mt-3 h-[520px] overflow-hidden rounded-lg border border-slate-200">
                    <PreviewPanel
                      sequences={sequences}
                      physician={previewPhysicians[previewIdx] ?? null}
                      sender={{ name: `${user.firstName} ${user.lastName}`, email: user.email }}
                      physicianIndex={previewPhysicians.length > 0 ? previewIdx + 1 : undefined}
                      physicianCount={previewPhysicians.length > 0 ? previewPhysicians.length : undefined}
                      onPrev={() => setPreviewIdx((i) => Math.max(0, i - 1))}
                      onNext={() => setPreviewIdx((i) => Math.min(previewPhysicians.length - 1, i + 1))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 ── Review & Launch */}
          {step === 3 && (
            <div className="mt-8 space-y-6">
              <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
                <SummaryRow label="Name"       value={form.getValues('name')} />
                <SummaryRow
                  label="Type"
                  value={TYPE_OPTIONS.find((t) => t.value === form.getValues('type'))?.label ?? ''}
                />
                <SummaryRow label="Steps"      value={`${fields.length} step${fields.length !== 1 ? 's' : ''}`} />
                <SummaryRow label="Physicians" value={`${physicianIds.length} selected`} />
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={isLoading}
                  onClick={handleSaveDraft}
                >
                  <Save className="h-4 w-4" />
                  Save as Draft
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* span so the tooltip can attach to a disabled button */}
                    <span className="flex-1">
                      <Button
                        type="button"
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading || physicianIds.length === 0 || fields.length === 0}
                        onClick={handleLaunch}
                      >
                        <Rocket className="h-4 w-4" />
                        {isLoading ? 'Launching…' : 'Launch Campaign'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {(physicianIds.length === 0 || fields.length === 0) && (
                    <TooltipContent side="top">
                      {fields.length === 0
                        ? 'Add at least one email step'
                        : 'Select at least one physician'}
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>

              {physicianIds.length === 0 && (
                <p className="text-center text-xs text-slate-500">
                  No physicians selected — save as Draft and enrol them later.
                </p>
              )}
            </div>
          )}

          {/* ── Navigation ───────────────────────────────────────────── */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as typeof step)}
              >
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < 3 && (
              <Button type="button" onClick={advance}>
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Preview panel (lg+) ──────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[340px] shrink-0 flex-col border-l border-slate-200">
        <PreviewPanel
          sequences={sequences}
          physician={previewPhysicians[previewIdx] ?? null}
          sender={{ name: `${user.firstName} ${user.lastName}`, email: user.email }}
          physicianIndex={previewPhysicians.length > 0 ? previewIdx + 1 : undefined}
          physicianCount={previewPhysicians.length > 0 ? previewPhysicians.length : undefined}
          onPrev={() => setPreviewIdx((i) => Math.max(0, i - 1))}
          onNext={() => setPreviewIdx((i) => Math.min(previewPhysicians.length - 1, i + 1))}
        />
      </div>
    </div>
  )
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, i) => {
        const n      = (i + 1) as 1 | 2 | 3
        const done   = n < current
        const active = n === current
        return (
          <div key={n} className="flex items-center">
            {i > 0 && (
              <div className={cn('mx-2 h-px w-8', done ? 'bg-blue-600' : 'bg-slate-200')} />
            )}
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  done   ? 'bg-blue-600 text-white' :
                  active ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                           'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : n}
              </span>
              <span
                className={cn(
                  'hidden text-xs font-medium sm:block',
                  active ? 'text-slate-900' : done ? 'text-slate-500' : 'text-slate-400',
                )}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  )
}
