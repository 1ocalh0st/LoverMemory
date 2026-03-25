import { describe, expect, it } from 'vitest'
import { SESSION_MAX_AGE_MS, clearCookieOptions, cookieOptions, normalizeDisplayName, normalizeEmail, parseLoginIdentifier } from './auth-utils.js'

describe('auth utils', () => {
  it('normalizes email input for stable lookup', () => {
    expect(normalizeEmail('  User@Example.COM  ')).toBe('user@example.com')
  })

  it('trims display names without changing visible casing', () => {
    expect(normalizeDisplayName('  Ke  ')).toBe('Ke')
  })

  it('parses email login identifiers', () => {
    expect(parseLoginIdentifier('  User@Example.COM ')).toEqual({
      value: 'user@example.com',
      isEmail: true
    })
  })

  it('parses display-name login identifiers', () => {
    expect(parseLoginIdentifier('  Ke  ')).toEqual({
      value: 'Ke',
      isEmail: false
    })
  })

  it('builds persistent cookie options', () => {
    expect(cookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_MS
    })
  })

  it('builds clear-cookie options without persistent maxAge', () => {
    expect(clearCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    })
    expect(clearCookieOptions()).not.toHaveProperty('maxAge')
  })
})
