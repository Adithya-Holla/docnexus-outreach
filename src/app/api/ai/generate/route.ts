import { type NextRequest } from 'next/server'
import { z } from 'zod'

const GenerateRequestSchema = z.object({
  physician: z.object({
    id:                  z.string(),
    firstName:           z.string(),
    lastName:            z.string(),
    specialty:           z.string(),
    subSpecialty:        z.string().nullable(),
    affiliation:         z.string(),
    city:                z.string(),
    state:               z.string(),
    email:               z.string(),
    npi:                 z.string(),
    npiRegistrationYear: z.number(),
    acceptingPatients:   z.boolean(),
    boardCertified:      z.boolean(),
    createdAt:           z.string(),
  }),
  campaignType: z.string().min(1),
  stepNumber:   z.number().int().min(1),
})

const GenerateResponseSchema = z.object({
  subject: z.string().min(1),
  body:    z.string().min(1),
})

const SYSTEM_PROMPT = `You are a Medical Science Liaison writing professional outreach emails to healthcare professionals.

Rules:
- Under 200 words
- Professional and compliant
- Educational, never promotional
- Personalized to physician specialty and affiliation
- No pricing discussion, no drug efficacy claims, no marketing language
- End with a clear CTA requesting a 15-minute call

Your response must be a raw JSON object with exactly two string fields: subject and body. No markdown, no code fences, no extra text. Example format:
{"subject":"Example subject line","body":"Example body text."}`

function buildUserPrompt(
  physician: z.infer<typeof GenerateRequestSchema>['physician'],
  campaignType: string,
  stepNumber: number,
): string {
  const spec = physician.subSpecialty ?? physician.specialty
  const step = stepNumber === 1 ? 'initial outreach' : `follow-up #${stepNumber - 1}`

  return `Write a ${step} email for a ${campaignType.replace(/_/g, ' ')} campaign.

Physician details:
- Name: Dr. ${physician.firstName} ${physician.lastName}
- Specialty: ${spec}
- Affiliation: ${physician.affiliation}
- Location: ${physician.city}, ${physician.state}

Generate an email subject and body personalized to this physician.`
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const parsed = GenerateRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const { physician, campaignType, stepNumber } = parsed.data

  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), 15_000)

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model:       'meta-llama/llama-3.3-70b-instruct:free',
        temperature: 0.7,
        max_tokens:  400,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: buildUserPrompt(physician, campaignType, stepNumber) },
        ],
      }),
      signal: controller.signal,
    })

    if (res.status === 429) {
      return Response.json(
        { error: 'Rate limit reached. Please wait a moment and try again.' },
        { status: 429 },
      )
    }

    if (!res.ok) {
      console.error('[POST /api/ai/generate] upstream status', res.status)
      return Response.json(
        { error: 'Failed to generate email. Please try again.' },
        { status: 502 },
      )
    }

    const json    = await res.json() as { choices?: Array<{ message?: { content?: string | null }; finish_reason?: string }> }
    const choice  = json.choices?.[0]

    if (!choice?.message?.content) {
      console.error('[POST /api/ai/generate] empty content, finish_reason:', choice?.finish_reason)
      return Response.json({ error: 'AI returned an empty response. Please try again.' }, { status: 502 })
    }

    // Strip optional markdown code fences some providers wrap around JSON
    const stripped = choice.message.content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let aiData: unknown
    try {
      aiData = JSON.parse(stripped)
    } catch {
      return Response.json({ error: 'AI returned an unexpected response format' }, { status: 502 })
    }

    const validated = GenerateResponseSchema.safeParse(aiData)
    if (!validated.success) {
      return Response.json({ error: 'AI response missing required fields' }, { status: 502 })
    }

    return Response.json(validated.data)
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return Response.json(
        { error: 'AI generation timed out. Please try again.' },
        { status: 504 },
      )
    }
    console.error('[POST /api/ai/generate]', err)
    return Response.json({ error: 'Failed to generate email. Please try again.' }, { status: 500 })
  } finally {
    clearTimeout(timeout)
  }
}
