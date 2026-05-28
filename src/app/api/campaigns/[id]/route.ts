// src/app/api/campaigns/[id]/route.ts
import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        sequences: { orderBy: { stepNumber: 'asc' } },
        enrollments: {
          include: { physician: true },
          orderBy: { enrolledAt: 'desc' },
        },
      },
    })

    if (!campaign) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return Response.json({ data: campaign })
  } catch (err) {
    console.error('[GET /api/campaigns/:id]', err)
    return Response.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}
