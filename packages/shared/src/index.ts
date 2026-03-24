export type LocaleCode = 'en' | 'zh'
export type ThemeMode = 'system' | 'light' | 'dark'
export type TimeFormat = '12h' | '24h'
export type Mood =
  | 'romantic'
  | 'happy'
  | 'peaceful'
  | 'excited'
  | 'nostalgic'
  | 'grateful'
  | 'tender'

export type AnniversaryType = 'countdown' | 'countup'
export type WishlistStatus = 'dreaming' | 'planning' | 'completed'
export type NotificationChannel = 'in_app' | 'web_push' | 'email'

export interface SessionUser {
  id: string
  email: string
  displayName: string | null
  locale: LocaleCode
  theme: ThemeMode
  timeFormat: TimeFormat
  timezone: string
}

export interface PairingStatus {
  isPaired: boolean
  seatNumber: 1 | 2 | null
  inviteCode: string | null
  inviteExpiresAt: string | null
  coupleSpace: {
    id: string
    title: string
    slug: string
    members: Array<{
      userId: string
      displayName: string | null
      seatNumber: number | null
    }>
  } | null
}

export interface MemoryAssetSummary {
  id: string
  originalUrl: string
  mimeType: string
  width: number | null
  height: number | null
  blurDataUrl: string | null
  variants: Record<string, string> | null
  isCover: boolean
}

export interface MemorySummary {
  id: string
  title: string
  story: string
  occurredAt: string
  mood: Mood
  locationName: string | null
  coverAsset: MemoryAssetSummary | null
  assets: MemoryAssetSummary[]
}

export interface AnniversarySummary {
  id: string
  title: string
  note: string | null
  targetDate: string
  type: AnniversaryType
  reminderDays: number[]
}

export interface WishlistItemSummary {
  id: string
  title: string
  note: string | null
  status: WishlistStatus
  priority: number
  linkedMemoryId: string | null
  linkedAnniversaryId: string | null
}
