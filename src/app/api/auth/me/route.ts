import { cookies } from 'next/headers'
import { getSession, COOKIE_NAME } from '@/lib/auth'

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const user = await getSession(token)
  if (!user) return Response.json({ error: 'Invalid session' }, { status: 401 })

  return Response.json({ data: user })
}
