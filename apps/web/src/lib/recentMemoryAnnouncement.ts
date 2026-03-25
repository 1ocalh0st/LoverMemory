export type RecentMemoryAnnouncement = {
  id: string
  title: string
  story: string
  occurredAt: string
  coverPath: string | null
  assetCount: number
  createdAt: string
}

const STORAGE_KEY = 'lm:recent-memory-announcement'

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function createRecentMemoryAnnouncement(memory: any): RecentMemoryAnnouncement {
  return {
    id: memory.id,
    title: memory.title || 'Untitled memory',
    story: memory.story || '',
    occurredAt: memory.occurredAt,
    coverPath: memory.coverAsset?.variants?.md || memory.coverAsset?.originalUrl || null,
    assetCount: Array.isArray(memory.assets) ? memory.assets.length : memory.coverAsset ? 1 : 0,
    createdAt: memory.createdAt || new Date().toISOString()
  }
}

export function readRecentMemoryAnnouncement() {
  if (!isBrowser()) {
    return null
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as RecentMemoryAnnouncement
    if (!parsed?.id || !parsed?.title || !parsed?.occurredAt) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeRecentMemoryAnnouncement(memory: any) {
  if (!isBrowser()) {
    return null
  }

  const announcement = createRecentMemoryAnnouncement(memory)
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(announcement))
  return announcement
}

export function clearRecentMemoryAnnouncement() {
  if (!isBrowser()) {
    return
  }

  window.sessionStorage.removeItem(STORAGE_KEY)
}
