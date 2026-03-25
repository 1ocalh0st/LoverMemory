import { AnniversaryType, Locale, Mood, Theme, TimeFormat, WishlistStatus } from '@prisma/client'

export const KNOWN_MOOD_VALUES = ['romantic', 'happy', 'peaceful', 'excited', 'nostalgic', 'grateful', 'tender'] as const

export function prismaLocale(value: string) {
  return value === 'zh' ? Locale.ZH : Locale.EN
}

export function localeFromPrisma(value: Locale) {
  return value === Locale.ZH ? 'zh' : 'en'
}

export function prismaTheme(value: string) {
  switch (value) {
    case 'dark':
      return Theme.DARK
    case 'light':
      return Theme.LIGHT
    default:
      return Theme.SYSTEM
  }
}

export function themeFromPrisma(value: Theme) {
  switch (value) {
    case Theme.DARK:
      return 'dark'
    case Theme.LIGHT:
      return 'light'
    default:
      return 'system'
  }
}

export function prismaTimeFormat(value: string) {
  return value === '12h' ? TimeFormat.H12 : TimeFormat.H24
}

export function timeFormatFromPrisma(value: TimeFormat) {
  return value === TimeFormat.H12 ? '12h' : '24h'
}

export function prismaMood(value: string) {
  const map: Record<string, Mood> = {
    romantic: Mood.ROMANTIC,
    happy: Mood.HAPPY,
    peaceful: Mood.PEACEFUL,
    excited: Mood.EXCITED,
    nostalgic: Mood.NOSTALGIC,
    grateful: Mood.GRATEFUL,
    tender: Mood.TENDER
  }
  return map[value] ?? Mood.TENDER
}

export function isKnownMoodValue(value?: string | null) {
  return Boolean(value && KNOWN_MOOD_VALUES.includes(value as (typeof KNOWN_MOOD_VALUES)[number]))
}

export function moodFromPrisma(value: Mood) {
  return value.toLowerCase()
}

export function prismaAnniversaryType(value: string) {
  return value === 'countup' ? AnniversaryType.COUNTUP : AnniversaryType.COUNTDOWN
}

export function anniversaryTypeFromPrisma(value: AnniversaryType) {
  return value === AnniversaryType.COUNTUP ? 'countup' : 'countdown'
}

export function prismaWishlistStatus(value: string) {
  switch (value) {
    case 'planning':
      return WishlistStatus.PLANNING
    case 'completed':
      return WishlistStatus.COMPLETED
    default:
      return WishlistStatus.DREAMING
  }
}

export function wishlistStatusFromPrisma(value: WishlistStatus) {
  return value.toLowerCase()
}
