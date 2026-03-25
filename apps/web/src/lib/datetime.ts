import { getSessionSnapshot } from './session'

export const DEFAULT_APP_TIME_ZONE = 'Asia/Shanghai'

type ZonedDateTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

const formatterCache = new Map<string, Intl.DateTimeFormat>()
const resolvedTimeZoneCache = new Map<string, string>()
const timeZoneAliases: Record<string, string> = {
  'gmt+8': 'Asia/Shanghai',
  'gmt+08:00': 'Asia/Shanghai',
  'utc+8': 'Asia/Shanghai',
  'utc+08:00': 'Asia/Shanghai'
}

function getDateTimeFormatter(timeZone: string) {
  const cacheKey = `${timeZone}:datetime`
  const cached = formatterCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  })
  formatterCache.set(cacheKey, formatter)
  return formatter
}

function getNumberPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return Number(parts.find((part) => part.type === type)?.value ?? 0)
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function resolveTimeZone(timeZone: string | null | undefined) {
  const rawValue = timeZone?.trim()
  if (!rawValue) {
    return DEFAULT_APP_TIME_ZONE
  }

  const normalizedValue = timeZoneAliases[rawValue.toLowerCase()] ?? rawValue
  const cached = resolvedTimeZoneCache.get(normalizedValue)
  if (cached) {
    return cached
  }

  try {
    new Intl.DateTimeFormat('en-US', {
      timeZone: normalizedValue
    }).format(new Date())
    resolvedTimeZoneCache.set(normalizedValue, normalizedValue)
    return normalizedValue
  } catch {
    resolvedTimeZoneCache.set(normalizedValue, DEFAULT_APP_TIME_ZONE)
    return DEFAULT_APP_TIME_ZONE
  }
}

function parseDateTimeLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) {
    return null
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: 0
  }
}

function fallbackIso(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function getComparableMinutes(parts: Pick<ZonedDateTimeParts, 'year' | 'month' | 'day' | 'hour' | 'minute'>) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) / 60000
}

function getZonedDateTimeParts(date: Date, timeZone = getAppTimeZone()): ZonedDateTimeParts {
  const parts = getDateTimeFormatter(timeZone).formatToParts(date)
  return {
    year: getNumberPart(parts, 'year'),
    month: getNumberPart(parts, 'month'),
    day: getNumberPart(parts, 'day'),
    hour: getNumberPart(parts, 'hour'),
    minute: getNumberPart(parts, 'minute'),
    second: getNumberPart(parts, 'second')
  }
}

export function getDatePartsInAppTimeZone(value: string | Date, timeZone = getAppTimeZone()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  const { year, month, day } = getZonedDateTimeParts(date, timeZone)
  return { year, month, day }
}

function resolveZonedDate(parts: ZonedDateTimeParts, timeZone = getAppTimeZone()) {
  let candidate = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const resolved = getZonedDateTimeParts(new Date(candidate), timeZone)
    const diffMinutes = getComparableMinutes(parts) - getComparableMinutes(resolved)
    if (!diffMinutes) {
      break
    }
    candidate += diffMinutes * 60_000
  }

  return new Date(candidate)
}

export function getAppTimeZone() {
  return resolveTimeZone(getSessionSnapshot()?.user?.timezone)
}

export function getCurrentDateTimeLocalValue(timeZone = getAppTimeZone()) {
  const parts = getZonedDateTimeParts(new Date(), timeZone)
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}

export function getCurrentDateInputValue(timeZone = getAppTimeZone()) {
  const parts = getZonedDateTimeParts(new Date(), timeZone)
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

export function dateTimeLocalToIso(value: string, timeZone = getAppTimeZone()) {
  const parts = parseDateTimeLocal(value)
  if (!parts) {
    return fallbackIso(value)
  }
  return resolveZonedDate(parts, timeZone).toISOString()
}

export function formatDateInAppTimeZone(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  },
  timeZone = getAppTimeZone()
) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(undefined, {
    ...options,
    timeZone
  }).format(date)
}
