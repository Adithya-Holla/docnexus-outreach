import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Status upgrade priority: higher index wins
const STATUS_RANK: Record<string, number> = {
  pending:        0,
  contacted:      1,
  opened:         2,
  bounced:        3,
  replied:        4,
  meeting_booked: 5,
}

const EVENT_TO_STATUS: Record<string, string> = {
  DELIVERED:      'contacted',
  OPENED:         'opened',
  REPLIED:        'replied',
  BOUNCED:        'bounced',
  MEETING_BOOKED: 'meeting_booked',
}

interface WebhookEvent {
  providerEventId:  string
  providerMessageId?: string
  eventType:        string   // DELIVERED | OPENED | REPLIED | BOUNCED
  timestamp?:       string
  metadata?:        Record<string, unknown>
}

export async function POST(request: NextRequest) {
  let events: WebhookEvent[]
  try {
    const body = await request.json()
    events = Array.isArray(body) ? body : [body]
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const results = await Promise.allSettled(
    events.map(async (ev) => {
      const { providerEventId, providerMessageId, eventType, timestamp, metadata } = ev

      if (!providerEventId || !eventType) return { skipped: true }

      // Idempotency — skip if already processed
      const existing = await prisma.emailEvent.findUnique({ where: { providerEventId } })
      if (existing) return { duplicate: providerEventId }

      // Resolve dispatch via providerMessageId
      const dispatch = providerMessageId
        ? await prisma.emailDispatch.findFirst({ where: { providerMessageId } })
        : null

      if (!dispatch) return { unresolved: providerMessageId }

      // Write event
      await prisma.emailEvent.create({
        data: {
          dispatchId:     dispatch.id,
          campaignId:     dispatch.campaignId,
          physicianId:    dispatch.physicianId,
          enrollmentId:   dispatch.enrollmentId,
          eventType:      eventType.toUpperCase(),
          timestamp:      timestamp ? new Date(timestamp) : new Date(),
          metadata:       metadata ? JSON.stringify(metadata) : null,
          providerEventId,
        },
      })

      // Upgrade enrollment status if new status is higher priority
      const newStatus = EVENT_TO_STATUS[eventType.toUpperCase()]
      if (newStatus) {
        const enrollment = await prisma.campaignEnrollment.findUnique({
          where:  { id: dispatch.enrollmentId },
          select: { status: true },
        })
        if (enrollment && (STATUS_RANK[newStatus] ?? 0) > (STATUS_RANK[enrollment.status] ?? 0)) {
          await prisma.campaignEnrollment.update({
            where: { id: dispatch.enrollmentId },
            data:  { status: newStatus },
          })
        }
      }

      return { ok: providerEventId }
    }),
  )

  return Response.json({ processed: results.length })
}
