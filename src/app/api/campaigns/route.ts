import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateCampaignSchema } from '@/lib/validations'

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { enrollments: true, sequences: true } },
      },
    })
    return Response.json({ data: campaigns })
  } catch (err) {
    console.error('[GET /api/campaigns]', err)
    return Response.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const parsed = CreateCampaignSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const { name, type, sequences } = parsed.data

  try {
    const campaign = await prisma.$transaction(async (tx) => {
      return tx.campaign.create({
        data: {
          name,
          type,
          sequences: {
            create: sequences.map((s) => ({
              stepNumber:      s.stepNumber,
              delayDays:       s.delayDays,
              subjectTemplate: s.subjectTemplate,
              bodyTemplate:    s.bodyTemplate,
            })),
          },
        },
        include: {
          sequences: { orderBy: { stepNumber: 'asc' } },
        },
      })
    })

    return Response.json({ data: campaign }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/campaigns]', err)
    return Response.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
