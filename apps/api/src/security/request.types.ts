import type { Locale, MembershipRole, Theme, TimeFormat } from '@prisma/client'
import type { Request } from 'express'

export interface AuthContext {
  userId: string
  email: string
  displayName: string | null
  locale: Locale
  theme: Theme
  timeFormat: TimeFormat
  timezone: string
  coupleSpaceId: string | null
  role: MembershipRole | null
  seatNumber: number | null
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext
}
