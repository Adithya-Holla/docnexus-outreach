'use client'

import { useRef } from 'react'
import { useController, useFormState, type Control } from 'react-hook-form'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEMPLATE_VARIABLES } from '@/lib/templateEngine'
import type { CampaignFormValues } from '@/lib/validations'
import type { Physician } from '@/types'
import { GenerateButton } from './GenerateButton'

const inputCls =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ' +
  'text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none ' +
  'focus:ring-1 focus:ring-blue-500'

const errCls = 'border-red-400 focus:border-red-400 focus:ring-red-200'

const CHIPS = TEMPLATE_VARIABLES

interface Props {
  index:        number
  control:      Control<CampaignFormValues>
  onRemove:     () => void
  canRemove:    boolean
  physician:    Physician | null
  campaignType: string
}

export function SequenceStep({ index, control, onRemove, canRemove, physician, campaignType }: Props) {
  const lastFocus   = useRef<'subject' | 'body'>('body')
  const subjectRef  = useRef<HTMLInputElement | null>(null)
  const bodyRef     = useRef<HTMLTextAreaElement | null>(null)

  const { errors } = useFormState({ control })

  // Dynamic array paths: RHF's FieldPath doesn't resolve template-literal indices
  // at compile time — cast is safe because the schema guarantees these fields exist.
  // defaultValue guards against a brief undefined during index-shift re-subscription.
  const { field: subjectField } = useController({ control, name: `sequences.${index}.subjectTemplate` as never, defaultValue: '' as never })
  const { field: bodyField }    = useController({ control, name: `sequences.${index}.bodyTemplate`    as never, defaultValue: '' as never })
  const { field: delayField }   = useController({ control, name: `sequences.${index}.delayDays`       as never, defaultValue: 0  as never })

  // Merge RHF ref with our DOM ref so we can read selectionStart/End
  const mergeSubjectRef = (el: HTMLInputElement | null) => {
    subjectField.ref(el)
    subjectRef.current = el
  }
  const mergeBodyRef = (el: HTMLTextAreaElement | null) => {
    bodyField.ref(el)
    bodyRef.current = el
  }

  function insertToken(token: string) {
    const isBody     = lastFocus.current === 'body'
    const el         = isBody ? bodyRef.current    : subjectRef.current
    const field      = isBody ? bodyField          : subjectField
    const currentVal = (field.value as string) ?? ''
    const start      = el?.selectionStart ?? currentVal.length
    const end        = el?.selectionEnd   ?? start
    const newVal     = currentVal.slice(0, start) + token + currentVal.slice(end)

    field.onChange(newVal)

    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  // Safe error access for dynamic array paths
  type StepErr = { message?: string } | undefined
  const stepErrs = errors.sequences as unknown as Array<{
    subjectTemplate?: StepErr
    bodyTemplate?: StepErr
    delayDays?: StepErr
  } | undefined> | undefined

  const subjectErr = stepErrs?.[index]?.subjectTemplate?.message
  const bodyErr    = stepErrs?.[index]?.bodyTemplate?.message
  const delayErr   = stepErrs?.[index]?.delayDays?.message

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* Step header — two rows when a delay error is present */}
      <div className={cn('border-b border-slate-200 bg-slate-50 px-4', index > 0 && delayErr ? 'pb-2 pt-2.5' : 'py-2.5')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {index + 1}
            </span>
            <span className="text-sm font-medium text-slate-700">
              {index === 0 ? 'Initial Outreach' : `Follow-up ${index}`}
            </span>
            {index > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="text-slate-300">·</span>
                Send after
                <input
                  type="number"
                  min={0}
                  max={365}
                  className={cn(
                    inputCls,
                    'w-14 py-0.5 px-1.5 text-center [appearance:textfield]',
                    delayErr && errCls,
                  )}
                  value={delayField.value as number}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value)
                    delayField.onChange(isNaN(n) ? 0 : n)
                  }}
                  onBlur={delayField.onBlur}
                  name={delayField.name}
                  ref={(el) => delayField.ref(el)}
                />
                days
              </span>
            )}
          </div>

          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove step ${index + 1}`}
              className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Delay validation error — sits flush below the inline row */}
        {index > 0 && delayErr && (
          <p className="ml-7 mt-1 text-[11px] text-red-500">{delayErr}</p>
        )}
      </div>

      <div className="space-y-3 p-4">
        {/* Subject */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Subject
          </label>
          <input
            type="text"
            placeholder="e.g. Reaching out about {{specialty}} research"
            className={cn(inputCls, subjectErr && errCls)}
            value={subjectField.value as string}
            onChange={subjectField.onChange}
            onBlur={subjectField.onBlur}
            name={subjectField.name}
            ref={mergeSubjectRef}
            onFocus={() => { lastFocus.current = 'subject' }}
          />
          {subjectErr && <p className="mt-1 text-[11px] text-red-500">{subjectErr}</p>}
        </div>

        {/* Body */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Body
          </label>
          <textarea
            rows={6}
            placeholder={`Hi {{doctor_name}},\n\nI'm reaching out about your work in {{specialty}} at {{affiliation}}…`}
            className={cn(inputCls, 'resize-y', bodyErr && errCls)}
            value={bodyField.value as string}
            onChange={bodyField.onChange}
            onBlur={bodyField.onBlur}
            name={bodyField.name}
            ref={mergeBodyRef}
            onFocus={() => { lastFocus.current = 'body' }}
          />
          {bodyErr && <p className="mt-1 text-[11px] text-red-500">{bodyErr}</p>}
        </div>

        {/* Variable chips + AI button */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Insert:
          </span>
          {CHIPS.map((v) => (
            <button
              key={v.key}
              type="button"
              title={v.description}
              onClick={() => insertToken(v.key)}
              className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[10px] text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100"
            >
              {v.key}
            </button>
          ))}
          <div className="ml-auto">
            <GenerateButton
              physician={physician}
              campaignType={campaignType}
              stepNumber={index + 1}
              onGenerated={(subject, body) => {
                subjectField.onChange(subject)
                bodyField.onChange(body)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
