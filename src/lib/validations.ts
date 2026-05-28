// src/lib/validations.ts
import { z } from 'zod'

export const SequenceStepSchema = z.object({
  stepNumber:      z.number().int().min(1),
  delayDays:       z.number().int().min(0),
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

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>
export type LaunchCampaignInput = z.infer<typeof LaunchCampaignSchema>
