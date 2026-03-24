import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { api } from './api'

export interface SessionPayload {
  authenticated: boolean
  csrfToken: string
  vapidPublicKey: string | null
  user?: {
    id: string
    email: string
    displayName: string | null
    locale: 'en' | 'zh'
    theme: 'system' | 'light' | 'dark'
    timeFormat: '12h' | '24h'
    timezone: string
    coupleSpaceId: string | null
    seatNumber: number | null
  }
}

let sessionCache: Promise<SessionPayload> | null = null

export function loadSession(force = false) {
  if (!sessionCache || force) {
    sessionCache = api<SessionPayload>('/session')
  }
  return sessionCache
}

export function clearSessionCache() {
  sessionCache = null
}

export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const session = await loadSession()
  const requiresAuth = to.meta.requiresAuth !== false
  const requiresPairing = to.meta.requiresPairing !== false

  if (to.name === 'auth' && session.authenticated) {
    next(session.user?.coupleSpaceId ? { name: 'home' } : { name: 'pairing' })
    return
  }

  if (requiresAuth && !session.authenticated) {
    next({ name: 'auth' })
    return
  }

  if (session.authenticated && to.name !== 'pairing' && requiresPairing && !session.user?.coupleSpaceId) {
    next({ name: 'pairing' })
    return
  }

  if (to.name === 'pairing' && session.user?.coupleSpaceId) {
    next({ name: 'home' })
    return
  }

  next()
}
