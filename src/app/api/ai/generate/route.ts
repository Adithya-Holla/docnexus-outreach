import { type NextRequest } from 'next/server'
import { z } from 'zod'

export const maxDuration = 30

const GenerateRequestSchema = z.object({
  sender: z.object({
    name:    z.string().min(1),
    title:   z.string().min(1),
    company: z.string().min(1),
  }),
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

const SYSTEM_PROMPT = `You are a Medical Science Liaison writing reusable email templates for outreach campaigns.

CRITICAL: Use template placeholders for ALL personalized data — never hard-code names, specialties, or institutions.

Available placeholders (use these exactly, with double curly braces):
- {{doctor_name}}   → "Dr. Smith"
- {{first_name}}    → "Jane"
- {{last_name}}     → "Smith"
- {{specialty}}     → "Cardiology"
- {{sub_specialty}} → falls back to specialty if absent
- {{affiliation}}   → "Mayo Clinic"
- {{city}}          → "Rochester"
- {{state}}         → "MN"

Rules:
- Under 200 words
- Professional and compliant
- Educational, never promotional
- No pricing discussion, no drug efficacy claims, no marketing language
- End with a clear CTA requesting a 15-minute call
- Use placeholders everywhere a real name, specialty, or institution would appear

Your response must be a raw JSON object with exactly two string fields: subject and body. No markdown, no code fences, no extra text. Example:
{"subject":"Insights for {{specialty}} Clinicians at {{affiliation}}","body":"Dear {{doctor_name}},\\n\\nI hope this message finds you well..."}`

function buildUserPrompt(
  physician: z.infer<typeof GenerateRequestSchema>['physician'],
  sender:    z.infer<typeof GenerateRequestSchema>['sender'],
  campaignType: string,
  stepNumber: number,
): string {
  const spec = physician.subSpecialty ?? physician.specialty
  const step = stepNumber === 1 ? 'initial outreach' : `follow-up #${stepNumber - 1}`

  return `Write a ${step} email template for a ${campaignType.replace(/_/g, ' ')} campaign targeting physicians.

RECIPIENT CONTEXT (use placeholders, NOT these literal values):
- Specialty: ${spec}
- Affiliation: ${physician.affiliation}
- Location: ${physician.city}, ${physician.state}

SENDER (use these EXACT literal values in the signature — no placeholders):
- Name: ${sender.name}
- Title: ${sender.title}
- Company: ${sender.company}

Rules:
- Every reference to the RECIPIENT (name, specialty, institution, location) MUST use a {{placeholder}}.
- The signature must contain the sender's real name, title, and company — never placeholders.
- Correct signature example:
  Best regards,
  ${sender.name}
  ${sender.title}
  ${sender.company}`
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

  const { physician, sender, campaignType, stepNumber } = parsed.data

  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), 28_000)

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model:       'openai/gpt-oss-20b:free',
        temperature: 0.7,
        max_tokens:  400,
        tool_choice: 'none',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: buildUserPrompt(physician, sender, campaignType, stepNumber) },
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
