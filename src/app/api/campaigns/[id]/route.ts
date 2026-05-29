import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCampaignMetrics } from '@/lib/campaignAnalytics'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params

  try {
    const [campaign, analytics] = await Promise.all([
      prisma.campaign.findUnique({
        where:   { id },
        include: {
          sequences:   { orderBy: { stepNumber: 'asc' } },
          enrollments: {
            include:  { physician: true },
            orderBy:  { enrolledAt: 'desc' },
          },
        },
      }),
      getCampaignMetrics(id),
    ])

    if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 })

    return Response.json({ data: { ...campaign, analytics } })
  } catch (err) {
    console.error('[GET /api/campaigns/:id]', err)
    return Response.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params
  try {
    const existing = await prisma.campaign.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return Response.json({ error: 'Campaign not found' }, { status: 404 })

    await prisma.campaign.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/campaigns/:id]', err)
    return Response.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
