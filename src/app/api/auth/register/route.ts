import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RegisterSchema } from '@/lib/validations'
import { hashPassword, createToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })
  }

  const { firstName, lastName, email, password, company, role, title } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const user = await prisma.user.create({
    data: { firstName, lastName, email, password: await hashPassword(password), company, role, title },
  })

  const token = await createToken({ id: user.id, email, firstName, lastName, company, role, title })

  return Response.json(
    { data: { id: user.id, firstName, lastName, email, company, role, title } },
    {
      status: 201,
      headers: {
        'Set-Cookie': `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`,
      },
    },
  )
}
