// src/lib/validations.ts
import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const USER_ROLES = ['pharma_marketing_manager', 'msl', 'medical_device_rep', 'other'] as const

export const RegisterSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName:  z.string().min(1, 'Required'),
  email:     z.string().email('Enter a valid email'),
  password:  z.string().min(8, 'At least 8 characters'),
  company:   z.string().min(1, 'Required'),
  role:      z.enum(USER_ROLES, { errorMap: () => ({ message: 'Select a role' }) }),
  title:     z.string().min(1, 'Required'),
})

export const LoginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Required'),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput    = z.infer<typeof LoginSchema>

// ─── Campaign ─────────────────────────────────────────────────────────────────

export const SequenceStepSchema = z.object({
  stepNumber:      z.number().int().min(1),
  delayDays:       z.number().int('Must be a whole number').min(0, 'Delay must be 0 or more days'),
  subjectTemplate: z.string().min(1).max(500),
  bodyTemplate:    z.string().min(1).max(5000),
})

export const CreateCampaignSchema = z.object({
  name:      z.string().min(1, 'Campaign name is required').max(255),
  type:      z.enum(['cold_outbound', 'reengagement', 'conference_followup'], {
    errorMap: () => ({ message: 'type must be cold_outbound | reengagement | conference_followup' }),
  }),
  sequences: z.array(SequenceStepSchema).min(1, 'At least one sequence step is required'),
})

export const LaunchCampaignSchema = z.object({
  physicianIds: z
    .array(z.string().uuid('Each physicianId must be a valid UUID'))
    .min(1, 'Select at least one physician'),
})

export type CreateCampaignInput  = z.infer<typeof CreateCampaignSchema>
export type LaunchCampaignInput  = z.infer<typeof LaunchCampaignSchema>
export type CampaignFormValues   = z.infer<typeof CreateCampaignSchema>
