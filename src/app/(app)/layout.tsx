import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession, COOKIE_NAME } from '@/lib/auth'
import { LayoutShell } from '@/components/layout/LayoutShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user  = token ? await getSession(token) : null
  if (!user) redirect('/login')

  return <LayoutShell user={user}>{children}</LayoutShell>
}
