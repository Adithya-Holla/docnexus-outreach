import { type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getSession, COOKIE_NAME } from '@/lib/auth'
import { getCampaignMetrics } from '@/lib/campaignAnalytics'

async function resolveSession() {
  const token = cookies().get(COOKIE_NAME)?.value
  return token ? getSession(token) : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id }    = params
  const session   = await resolveSession()
  if (!session) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

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

    // Enforce ownership (null userId = pre-auth campaign, accessible by owner who launched it)
    if (campaign.userId && campaign.userId !== session.id) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 })
    }

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
  const { id }  = params
  const session = await resolveSession()
  if (!session) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  try {
    const existing = await prisma.campaign.findUnique({ where: { id }, select: { id: true, userId: true } })
    if (!existing) return Response.json({ error: 'Campaign not found' }, { status: 404 })

    if (existing.userId && existing.userId !== session.id) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 })
    }

    await prisma.campaign.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/campaigns/:id]', err)
    return Response.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
