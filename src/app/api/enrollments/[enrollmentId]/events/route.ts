import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const MANUAL_EVENTS = ['REPLIED', 'BOUNCED', 'MEETING_BOOKED'] as const

const BodySchema = z.object({
  eventType: z.enum(MANUAL_EVENTS),
})

const STATUS_RANK: Record<string, number> = {
  pending: 0, contacted: 1, opened: 2, bounced: 3, replied: 4, meeting_booked: 5,
}

const EVENT_TO_STATUS: Record<string, string> = {
  REPLIED:        'replied',
  BOUNCED:        'bounced',
  MEETING_BOOKED: 'meeting_booked',
}

export async function POST(
  request: NextRequest,
  { params }: { params: { enrollmentId: string } },
) {
  const { enrollmentId } = params

  let body: unknown
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })
  }

  const { eventType } = parsed.data

  const enrollment = await prisma.campaignEnrollment.findUnique({ where: { id: enrollmentId } })
  if (!enrollment) return Response.json({ error: 'Enrollment not found' }, { status: 404 })

  // Find the most recent dispatch to link this event to (optional)
  const latestDispatch = await prisma.emailDispatch.findFirst({
    where:   { enrollmentId },
    orderBy: { sentAt: 'desc' },
  })

  await prisma.emailEvent.create({
    data: {
      dispatchId:  latestDispatch?.id ?? null,
      campaignId:  enrollment.campaignId,
      physicianId: enrollment.physicianId,
      enrollmentId,
      eventType,
      timestamp:   new Date(),
    },
  })

  // Upgrade status if new status is higher priority
  const newStatus = EVENT_TO_STATUS[eventType]
  if (newStatus && (STATUS_RANK[newStatus] ?? 0) > (STATUS_RANK[enrollment.status] ?? 0)) {
    await prisma.campaignEnrollment.update({
      where: { id: enrollmentId },
      data:  { status: newStatus },
    })
  }

  const updated = await prisma.campaignEnrollment.findUnique({ where: { id: enrollmentId } })
  return Response.json({ data: updated })
}
