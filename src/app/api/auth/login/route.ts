import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LoginSchema } from '@/lib/validations'
import { verifyPassword, createToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })
  }

  const { email, password } = parsed.data

  let user
  try {
    user = await prisma.user.findUnique({ where: { email } })
  } catch {
    return Response.json({ error: 'Service unavailable. Please try again.' }, { status: 503 })
  }

  if (!user || !(await verifyPassword(password, user.password))) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const { id, firstName, lastName, company, role, title } = user
  const token  = await createToken({ id, email, firstName, lastName, company, role, title })
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''

  return Response.json(
    { data: { id, firstName, lastName, email, company, role, title } },
    {
      headers: {
        'Set-Cookie': `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`,
      },
    },
  )
}
