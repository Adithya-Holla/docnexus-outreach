import { prisma } from './prisma'

export interface ChartDay {
  day:  string   // "Mon", "Tue", …
  sent: number
}

export interface CampaignMetrics {
  messagesSent:   number
  delivered:      number
  opened:         number
  replied:        number
  bounced:        number
  meetingsBooked: number
  openRate:       number   // percentage, 1 dp
  replyRate:      number
  bounceRate:     number
  chartData:      ChartDay[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Count distinct dispatches that have at least one event of the given type. */
async function countUniqueDispatches(campaignId: string, eventType: string): Promise<number> {
  const rows = await prisma.emailEvent.findMany({
    where:    { campaignId, eventType },
    distinct: ['dispatchId'],
    select:   { dispatchId: true },
  })
  return rows.length
}

/** Count distinct enrollments that have at least one event of the given type. */
async function countUniqueEnrollments(campaignId: string, eventType: string): Promise<number> {
  const rows = await prisma.emailEvent.findMany({
    where:    { campaignId, eventType },
    distinct: ['enrollmentId'],
    select:   { enrollmentId: true },
  })
  return rows.length
}

/** Build a 7-day chart array with zero-fill for missing days. */
async function buildChartData(campaignId: string): Promise<ChartDay[]> {
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Build the 7-day window in JavaScript to avoid raw SQLite date quirks
  const days: { iso: string; label: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    days.push({ iso: d.toISOString().slice(0, 10), label: DAY_NAMES[d.getUTCDay()] })
  }

  const windowStart = new Date(days[0].iso + 'T00:00:00.000Z')

  // Fetch all dispatches within the window using Prisma's typed API
  const dispatches = await prisma.emailDispatch.findMany({
    where:  { campaignId, sentAt: { gte: windowStart } },
    select: { sentAt: true },
  })

  // Group by ISO date
  const byDate = new Map<string, number>()
  for (const { sentAt } of dispatches) {
    const iso = sentAt instanceof Date
      ? sentAt.toISOString().slice(0, 10)
      : String(sentAt).slice(0, 10)
    byDate.set(iso, (byDate.get(iso) ?? 0) + 1)
  }

  return days.map(({ iso, label }) => ({ day: label, sent: byDate.get(iso) ?? 0 }))
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
  const [
    messagesSent,
    delivered,
    opened,
    replied,
    bounced,
    meetingsBooked,
    chartData,
  ] = await Promise.all([
    prisma.emailDispatch.count({ where: { campaignId } }),
    countUniqueDispatches(campaignId, 'DELIVERED'),
    countUniqueDispatches(campaignId, 'OPENED'),
    countUniqueEnrollments(campaignId, 'REPLIED'),
    countUniqueDispatches(campaignId, 'BOUNCED'),
    countUniqueEnrollments(campaignId, 'MEETING_BOOKED'),
    buildChartData(campaignId),
  ])

  const base      = delivered > 0 ? delivered : 0
  const openRate  = base > 0 ? Math.round((opened  / base) * 1000) / 10 : 0
  const replyRate = base > 0 ? Math.round((replied / base) * 1000) / 10 : 0
  const bounceRate = messagesSent > 0 ? Math.round((bounced / messagesSent) * 1000) / 10 : 0

  return {
    messagesSent,
    delivered,
    opened,
    replied,
    bounced,
    meetingsBooked,
    openRate,
    replyRate,
    bounceRate,
    chartData,
  }
}

