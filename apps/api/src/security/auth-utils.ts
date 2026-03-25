import crypto from 'node:crypto'

export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365

export function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export function randomToken(size = 32) {
  return crypto.randomBytes(size).toString('base64url')
}

export function normalizeEmail(input: string) {
  return input.trim().toLowerCase()
}

export function normalizeDisplayName(input: string) {
  return input.trim()
}

export function parseLoginIdentifier(input: string) {
  const value = input.trim()
  const isEmail = value.includes('@')
  return {
    value: isEmail ? value.toLowerCase() : value,
    isEmail
  }
}

export function cookieOptions(httpOnly = true) {
  const secure = process.env.NODE_ENV === 'production'
  return {
    httpOnly,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: SESSION_MAX_AGE_MS
  }
}

export function clearCookieOptions(httpOnly = true) {
  const secure = process.env.NODE_ENV === 'production'
  return {
    httpOnly,
    sameSite: 'lax' as const,
    secure,
    path: '/'
  }
}
