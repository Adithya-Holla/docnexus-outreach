import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession, COOKIE_NAME } from '@/lib/auth'
import { AuthForm } from '@/components/auth/AuthForm'

export default async function LoginPage() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (token && await getSession(token)) redirect('/physicians')

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <AuthForm />
    </div>
  )
}
