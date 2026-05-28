// src/app/api/physicians/route.ts
import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * All query params are optional strings from the URL. yearFrom/yearTo are
 * coerced to integers. Empty strings are stripped before parsing so that
 * ?yearFrom= (cleared input) is treated as "no filter" rather than NaN.
 */
const QuerySchema = z.object({
  specialty:   z.string().min(1).optional(),
  state:       z.string().min(1).optional(),
  affiliation: z.string().min(1).optional(),
  search:      z.string().min(1).optional(),
  yearFrom: z
    .string()
    .regex(/^\d+$/, 'yearFrom must be a positive integer')
    .transform(Number)
    .optional(),
  yearTo: z
    .string()
    .regex(/^\d+$/, 'yearTo must be a positive integer')
    .transform(Number)
    .optional(),
})

export async function GET(request: NextRequest) {
  // Strip empty strings before handing to Zod so cleared inputs are ignored
  const rawParams: Record<string, string> = {}
  request.nextUrl.searchParams.forEach((value, key) => {
    if (value.trim() !== '') rawParams[key] = value.trim()
  })

  const parsed = QuerySchema.safeParse(rawParams)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid query parameters', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { specialty, state, affiliation, yearFrom, yearTo, search } = parsed.data

  // Build the Prisma where clause entirely in the DB — no JS post-filtering
  const where: Prisma.PhysicianWhereInput = {}

  // Exact-match filters (uses the @@index'd columns for fast lookups)
  if (specialty)   where.specialty = specialty
  if (state)       where.state     = state

  // Partial match on affiliation (user types a fragment of a hospital name)
  if (affiliation) where.affiliation = { contains: affiliation }

  // Year range — either bound is independently optional
  if (yearFrom !== undefined || yearTo !== undefined) {
    where.npiRegistrationYear = {
      ...(yearFrom !== undefined && { gte: yearFrom }),
      ...(yearTo   !== undefined && { lte: yearTo   }),
    }
  }

  /**
   * Case-insensitive name search via OR.
   * SQLite's LIKE operator is case-insensitive for ASCII characters by
   * default, so Prisma's `contains` (which compiles to LIKE '%value%')
   * gives us the behaviour we need without `mode: 'insensitive'`
   * (which SQLite does not support).
   * The OR sits alongside other where keys, so Prisma wraps it correctly:
   *   WHERE specialty = ? AND (firstName LIKE ? OR lastName LIKE ?)
   */
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName:  { contains: search } },
    ]
  }

  try {
    // Run all three queries in a single transaction for a consistent snapshot
    const [data, filtered, total] = await prisma.$transaction([
      prisma.physician.findMany({ where, orderBy: { lastName: 'asc' } }),
      prisma.physician.count({ where }),
      prisma.physician.count(),          // unfiltered — always the full DB count
    ])

    return Response.json({ data, total, filtered })
  } catch (err) {
    console.error('[GET /api/physicians]', err)
    return Response.json(
      { error: 'Failed to fetch physicians. Please try again.' },
      { status: 500 },
    )
  }
}
