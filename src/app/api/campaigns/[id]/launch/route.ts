// src/app/api/campaigns/[id]/launch/route.ts
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

  // Pre-flight checks before opening a write transaction.
  // Doing these outside the transaction avoids acquiring a write lock just to
  // return an early error.
  const existing = await prisma.campaign.findUnique({ where: { id } })

  if (!existing) {
    return Response.json({ error: 'Campaign not found' }, { status: 404 })
  }

  if (existing.status !== 'draft') {
    return Response.json(
      { error: 'Campaign is already active or completed' },
      { status: 400 },
    )
  }

  try {
    // Transaction: flip status to 'active' AND insert enrollments atomically.
    // If the enrollment inserts fail (e.g. a physicianId doesn't exist in DB),
    // the status update is rolled back so the campaign stays in 'draft'.
    const updated = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.update({
        where: { id },
        data: { status: 'active' },
      })

      // Upsert each enrollment individually using the @@unique compound key.
      // update: {} is a no-op — if a physician is already enrolled this call
      // is idempotent and won't overwrite their existing status.
      await Promise.all(
        physicianIds.map((physicianId) =>
          tx.campaignEnrollment.upsert({
            where: {
              campaignId_physicianId: { campaignId: id, physicianId },
            },
            update:  {},
            create:  { campaignId: id, physicianId, status: 'contacted' },
          }),
        ),
      )

      return campaign
    })

    // Count after transaction so the number reflects what was actually written
    const enrolledCount = await prisma.campaignEnrollment.count({
      where: { campaignId: id },
    })

    return Response.json({
      data: { ...updated, enrolledCount },
    })
  } catch (err) {
    console.error('[PATCH /api/campaigns/:id/launch]', err)
    return Response.json({ error: 'Failed to launch campaign' }, { status: 500 })
  }
}
