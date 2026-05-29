import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LaunchCampaignSchema } from '@/lib/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params

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
  if (existing.status !== 'draft') {
    return Response.json({ error: 'Campaign is already active or completed' }, { status: 400 })
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.update({
        where: { id },
        data:  { status: 'active' },
      })

      // Upsert enrollments — idempotent
      const enrollments = await Promise.all(
        physicianIds.map((physicianId) =>
          tx.campaignEnrollment.upsert({
            where:  { campaignId_physicianId: { campaignId: id, physicianId } },
            update: {},
            create: { campaignId: id, physicianId, status: 'contacted' },
          }),
        ),
      )

      // Create one EmailDispatch per enrollment × sequence step,
      // scheduled at now + delayDays.  For step 1 (delay=0) sentAt=now.
      const now = new Date()
      for (const enrollment of enrollments) {
        for (const step of existing.sequences) {
          const sentAt = new Date(now.getTime() + step.delayDays * 86_400_000)

          const dispatch = await tx.emailDispatch.create({
            data: {
              campaignId:    id,
              physicianId:   enrollment.physicianId,
              enrollmentId:  enrollment.id,
              sequenceStepId: step.id,
              sentAt,
            },
          })

          // Record the SENT event immediately for step 1 (delay=0).
          // Future steps get their SENT event when the scheduler fires them.
          if (step.delayDays === 0) {
            await tx.emailEvent.create({
              data: {
                dispatchId:  dispatch.id,
                campaignId:  id,
                physicianId: enrollment.physicianId,
                enrollmentId: enrollment.id,
                eventType:   'SENT',
                timestamp:   sentAt,
              },
            })
          }
        }
      }

      return campaign
    })

    const enrolledCount = await prisma.campaignEnrollment.count({ where: { campaignId: id } })
    return Response.json({ data: { ...updated, enrolledCount } })
  } catch (err) {
    console.error('[PATCH /api/campaigns/:id/launch]', err)
    return Response.json({ error: 'Failed to launch campaign' }, { status: 500 })
  }
}
