import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendCampaignEmail } from '@/lib/emailSender'
import type { Physician } from '@/types'

// Vercel Cron calls this endpoint with Authorization: Bearer <CRON_SECRET>.
// Schedule is defined in vercel.json — runs every hour.
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Find all dispatches that are due (sentAt in the past) and have not been
  // sent yet (no SENT EmailEvent). Only process active campaigns.
  const due = await prisma.emailDispatch.findMany({
    where: {
      sentAt:   { lte: now },
      campaign: { status: 'active' },
      events:   { none: { eventType: 'SENT' } },
    },
    include: {
      sequenceStep: true,
      enrollment:   { include: { physician: true } },
      campaign:     { select: { id: true, userId: true } },
    },
  })

  if (due.length === 0) {
    return Response.json({ sent: 0, message: 'No due dispatches' })
  }

  // Batch-fetch users so we have sender info for each campaign owner
  const userIds = Array.from(new Set(due.map((d) => d.campaign.userId).filter(Boolean))) as string[]
  const users   = await prisma.user.findMany({ where: { id: { in: userIds } } })
  const userMap = new Map(users.map((u) => [u.id, u]))

  let sent = 0
  let failed = 0

  for (const dispatch of due) {
    const user = userMap.get(dispatch.campaign.userId ?? '')
    if (!user) {
      console.warn(`[cron] no user for campaign ${dispatch.campaignId}, skipping`)
      continue
    }

    const sender = {
      name:    `${user.firstName} ${user.lastName}`,
      email:   user.email,
      title:   user.title,
      company: user.company,
    }

    let providerMessageId: string | null = null

    try {
      const result = await sendCampaignEmail({
        dispatchId:      dispatch.id,
        physician:       dispatch.enrollment.physician as unknown as Physician,
        sender,
        subjectTemplate: dispatch.sequenceStep.subjectTemplate,
        bodyTemplate:    dispatch.sequenceStep.bodyTemplate,
      })
      providerMessageId = result.providerMessageId
      sent++
    } catch (err) {
      console.error(`[cron] send failed for dispatch ${dispatch.id}:`, err)
      failed++
      continue
    }

    // Update providerMessageId and record SENT event atomically
    await prisma.$transaction([
      prisma.emailDispatch.update({
        where: { id: dispatch.id },
        data:  { providerMessageId, sentAt: now },
      }),
      prisma.emailEvent.create({
        data: {
          dispatchId:   dispatch.id,
          campaignId:   dispatch.campaignId,
          physicianId:  dispatch.physicianId,
          enrollmentId: dispatch.enrollmentId,
          eventType:    'SENT',
          timestamp:    now,
        },
      }),
    ])
  }

  console.log(`[cron] send-followups: sent=${sent} failed=${failed} skipped=${due.length - sent - failed}`)
  return Response.json({ sent, failed, total: due.length })
}
