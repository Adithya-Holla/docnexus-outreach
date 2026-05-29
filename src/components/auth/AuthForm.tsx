'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RegisterSchema, LoginSchema, USER_ROLES, type RegisterInput, type LoginInput } from '@/lib/validations'
import { ROLE_LABELS } from '@/lib/auth'

const inputCls = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
const errCls   = 'border-red-400 focus:border-red-400 focus:ring-red-200'
const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500'

// ─── Register ─────────────────────────────────────────────────────────────────

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  })

  async function onSubmit(data: RegisterInput) {
    setServerError(null)
    const res  = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    const json = await res.json() as { error?: string }
    if (!res.ok) { setServerError(json.error ?? 'Registration failed'); return }
    router.push('/physicians')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>First Name *</label>
          <input className={cn(inputCls, errors.firstName && errCls)} placeholder="Jane" {...register('firstName')} />
          {errors.firstName && <p className="mt-1 text-[11px] text-red-500">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Last Name *</label>
          <input className={cn(inputCls, errors.lastName && errCls)} placeholder="Smith" {...register('lastName')} />
          {errors.lastName && <p className="mt-1 text-[11px] text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelCls}>Work Email *</label>
        <input type="email" className={cn(inputCls, errors.email && errCls)} placeholder="jane@pharma.com" {...register('email')} />
        {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Password *</label>
        <input type="password" className={cn(inputCls, errors.password && errCls)} placeholder="Min. 8 characters" {...register('password')} />
        {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Company / Organisation *</label>
        <input className={cn(inputCls, errors.company && errCls)} placeholder="Novartis" {...register('company')} />
        {errors.company && <p className="mt-1 text-[11px] text-red-500">{errors.company.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Role *</label>
        <select className={cn(inputCls, errors.role && errCls)} {...register('role')}>
          <option value="">Select your role</option>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        {errors.role && <p className="mt-1 text-[11px] text-red-500">{errors.role.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Job Title *</label>
        <input className={cn(inputCls, errors.title && errCls)} placeholder="Senior Medical Science Liaison" {...register('title')} />
        {errors.title && <p className="mt-1 text-[11px] text-red-500">{errors.title.message}</p>}
      </div>

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</> : 'Create Account'}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="font-medium text-blue-600 hover:underline">
          Sign in
        </button>
      </p>
    </form>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setServerError(null)
    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    const json = await res.json() as { error?: string }
    if (!res.ok) { setServerError(json.error ?? 'Login failed'); return }
    router.push('/physicians')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelCls}>Work Email *</label>
        <input type="email" className={cn(inputCls, errors.email && errCls)} placeholder="jane@pharma.com" {...register('email')} />
        {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Password *</label>
        <input type="password" className={cn(inputCls, errors.password && errCls)} placeholder="Your password" {...register('password')} />
        {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>}
      </div>

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : 'Sign In'}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitch} className="font-medium text-blue-600 hover:underline">
          Register
        </button>
      </p>
    </form>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function AuthForm({ defaultTab = 'login' }: { defaultTab?: 'login' | 'register' }) {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)

  return (
    <div className="w-full max-w-md">
      {/* Logo / brand */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
          <span className="text-xl font-bold text-white">D</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">DocNexus Outreach</h1>
        <p className="mt-1 text-sm text-slate-500">
          Physician outreach for life sciences teams
        </p>
      </div>

      {/* Tab switcher */}
      <div className="mb-6 flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        {(['login', 'register'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
              tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t === 'login' ? 'Sign In' : 'Register'}
          </button>
        ))}
      </div>

      {tab === 'login'
        ? <LoginForm    onSwitch={() => setTab('register')} />
        : <RegisterForm onSwitch={() => setTab('login')} />
      }
    </div>
  )
}
