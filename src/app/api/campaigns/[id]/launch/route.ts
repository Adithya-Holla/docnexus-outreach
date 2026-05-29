import { type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getSession, COOKIE_NAME } from '@/lib/auth'
import { LaunchCampaignSchema } from '@/lib/validations'
import { sendCampaignEmail } from '@/lib/emailSender'
import type { Physician } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params

  // Resolve the logged-in user — their name + email become the sender identity
  const token  = cookies().get(COOKIE_NAME)?.value
  const session = token ? await getSession(token) : null
  if (!session) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const sender = {
    name:    `${session.firstName} ${session.lastName}`,
    email:   session.email,
    title:   session.title,
    company: session.company,
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const parsed = LaunchCampaignSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const { physicianIds } = parsed.data

  const existing = await prisma.campaign.findUnique({
    where:   { id },
    include: { sequences: { orderBy: { stepNumber: 'asc' } } },
  })

  if (!existing) return Response.json({ error: 'Campaign not found' }, { status: 404 })

  if (existing.userId && existing.userId !== session.id) {
    return Response.json({ error: 'Campaign not found' }, { status: 404 })
  }

  if (existing.status !== 'draft') {
    return Response.json({ error: 'Campaign is already active or completed' }, { status: 400 })
  }

  // Fetch physician records upfront (needed for template rendering + email send)
  const physicians = await prisma.physician.findMany({
    where: { id: { in: physicianIds } },
  })
  const physicianMap = new Map(physicians.map((p) => [p.id, p]))

  try {
    // ── Atomic transaction: status flip + enrollments + dispatches + SENT events ──
    const { enrollments } = await prisma.$transaction(async (tx) => {
      await tx.campaign.update({ where: { id }, data: { status: 'active', userId: session.id } })

      const enrollments = await Promise.all(
        physicianIds.map((physicianId) =>
          tx.campaignEnrollment.upsert({
            where:  { campaignId_physicianId: { campaignId: id, physicianId } },
            update: {},
            create: { campaignId: id, physicianId, status: 'contacted' },
          }),
        ),
      )

      const now = new Date()

      for (const enrollment of enrollments) {
        for (const step of existing.sequences) {
          const sentAt = new Date(now.getTime() + step.delayDays * 86_400_000)

          await tx.emailDispatch.create({
            data: {
              campaignId:    id,
              physicianId:   enrollment.physicianId,
              enrollmentId:  enrollment.id,
              sequenceStepId: step.id,
              sentAt,
              // providerMessageId is filled below, after the transaction, for step 1
            },
          })
        }
      }

      return { enrollments }
    })

    // ── Send step-1 emails outside the transaction (avoids long write locks) ──
    const step1 = existing.sequences.find((s) => s.delayDays === 0)

    if (step1) {
      const sentAt = new Date()

      for (const enrollment of enrollments) {
        const physician = physicianMap.get(enrollment.physicianId)
        if (!physician) continue

        // Find the dispatch we just created for step 1
        const dispatch = await prisma.emailDispatch.findFirst({
          where: { enrollmentId: enrollment.id, sequenceStepId: step1.id },
        })
        if (!dispatch) continue

        let providerMessageId: string | null = null

        try {
          const result = await sendCampaignEmail({
            dispatchId:      dispatch.id,
            physician:       physician as unknown as Physician,
            sender,
            subjectTemplate: step1.subjectTemplate,
            bodyTemplate:    step1.bodyTemplate,
          })
          providerMessageId = result.providerMessageId
        } catch (err) {
          console.error(`[launch] email send failed for physician ${physician.id}:`, err)
          // Continue — don't abort other sends because one failed
        }

        // Record SENT event + store providerMessageId
        await prisma.$transaction([
          prisma.emailDispatch.update({
            where: { id: dispatch.id },
            data:  { providerMessageId, sentAt },
          }),
          prisma.emailEvent.create({
            data: {
              dispatchId:  dispatch.id,
              campaignId:  id,
              physicianId: enrollment.physicianId,
              enrollmentId: enrollment.id,
              eventType:   'SENT',
              timestamp:   sentAt,
            },
          }),
        ])
      }
    }

    const enrolledCount = await prisma.campaignEnrollment.count({ where: { campaignId: id } })
    const updated = await prisma.campaign.findUnique({ where: { id } })
    return Response.json({ data: { ...updated, enrolledCount } })
  } catch (err) {
    console.error('[PATCH /api/campaigns/:id/launch]', err)
    return Response.json({ error: 'Failed to launch campaign' }, { status: 500 })
  }
}
