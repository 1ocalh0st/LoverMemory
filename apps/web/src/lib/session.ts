import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { api } from './api'

export interface SessionPayload {
  authenticated: boolean
  csrfToken: string
  vapidPublicKey: string | null
  recoveryMode?: 'disabled' | 'preview'
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

  const isAuthenticated = session?.authenticated ?? false

  if (to.name === 'auth' && isAuthenticated) {
    next(session?.user?.coupleSpaceId ? { name: 'home' } : { name: 'pairing' })
    return
  }

  if (requiresAuth && !isAuthenticated) {
    next({ name: 'auth' })
    return
  }

  if (isAuthenticated && to.name !== 'pairing' && requiresPairing && !session?.user?.coupleSpaceId) {
    next({ name: 'pairing' })
    return
  }

  if (to.name === 'pairing' && session?.user?.coupleSpaceId) {
    next({ name: 'home' })
    return
  }

  next()
}
