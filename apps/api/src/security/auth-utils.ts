import crypto from 'node:crypto'

export function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export function randomToken(size = 32) {
  return crypto.randomBytes(size).toString('base64url')
}

export function cookieOptions(httpOnly = true) {
  const secure = process.env.NODE_ENV === 'production'
  return {
    httpOnly,
    sameSite: 'lax' as const,
    secure,
    path: '/'
  }
}
