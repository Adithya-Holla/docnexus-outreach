import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

export const COOKIE_NAME    = 'dn_session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export const ROLE_LABELS: Record<string, string> = {
  pharma_marketing_manager: 'Pharma Marketing Manager',
  msl:                      'Medical Science Liaison',
  medical_device_rep:       'Medical Device Representative',
  other:                    'Other',
}

export interface SessionUser {
  id:        string
  email:     string
  firstName: string
  lastName:  string
  company:   string
  role:      string
  title:     string
}

function secret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set')
  return new TextEncoder().encode(s)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}

export async function getSession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}
