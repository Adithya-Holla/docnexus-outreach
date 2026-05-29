import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Smallest valid 1×1 transparent GIF (35 bytes)
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
)

export async function GET(request: NextRequest) {
  const dispatchId = request.nextUrl.searchParams.get('dispatchId')

  if (dispatchId) {
    try {
      const dispatch = await prisma.emailDispatch.findUnique({
        where:  { id: dispatchId },
        select: { id: true, campaignId: true, physicianId: true, enrollmentId: true },
      })

      if (dispatch) {
        // Record OPENED event (allow multiple — analytics dedups with distinct)
        await prisma.emailEvent.create({
          data: {
            dispatchId:  dispatch.id,
            campaignId:  dispatch.campaignId,
            physicianId: dispatch.physicianId,
            enrollmentId: dispatch.enrollmentId,
            eventType:   'OPENED',
          },
        })

        // Upgrade enrollment status to "opened" (if not already higher)
        await prisma.campaignEnrollment.updateMany({
          where: {
            id:     dispatch.enrollmentId,
            status: { in: ['contacted', 'pending'] },
          },
          data: { status: 'opened' },
        })
      }
    } catch {
      // Never block pixel delivery on DB errors
    }
  }

  return new Response(PIXEL, {
    headers: {
      'Content-Type':  'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma':        'no-cache',
    },
  })
}
