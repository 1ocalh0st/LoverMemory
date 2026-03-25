import type {
  Anniversary,
  Memory,
  MemoryAsset,
  Membership,
  NotificationRecord,
  PairingInvite,
  User,
  WishlistItem
} from '@prisma/client'
import {
  anniversaryTypeFromPrisma,
  localeFromPrisma,
  moodFromPrisma,
  themeFromPrisma,
  timeFormatFromPrisma,
  wishlistStatusFromPrisma
} from './domain.js'
import { assetMediaPath, assetVariantUrls } from './media.js'

export function mapMemoryAsset(asset: MemoryAsset) {
  const failed = asset.status === 'FAILED'
  return {
    id: asset.id,
    originalUrl: failed ? '' : assetMediaPath(asset.id),
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    blurDataUrl: asset.blurDataUrl,
    variants: failed ? null : assetVariantUrls(asset.id),
    isCover: asset.isCover,
    status: asset.status.toLowerCase()
  }
}

export function mapMemory(memory: Memory & { assets?: MemoryAsset[]; coverAsset?: MemoryAsset | null }) {
  const assets = memory.assets?.map(mapMemoryAsset) ?? []
  return {
    id: memory.id,
    title: memory.title,
    story: memory.story,
    occurredAt: memory.occurredAt.toISOString(),
    sortAt: memory.sortAt.toISOString(),
    mood: memory.customMood?.trim() || moodFromPrisma(memory.mood),
    locationName: memory.locationName,
    latitude: memory.latitude ? Number(memory.latitude) : null,
    longitude: memory.longitude ? Number(memory.longitude) : null,
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString(),
    coverAsset: memory.coverAsset ? mapMemoryAsset(memory.coverAsset) : assets.find((asset: any) => asset.isCover) ?? null,
    assets
  }
}

export function mapAnniversary(anniversary: Anniversary) {
  return {
    id: anniversary.id,
    title: anniversary.title,
    note: anniversary.note,
    targetDate: anniversary.targetDate.toISOString(),
    type: anniversaryTypeFromPrisma(anniversary.type),
    reminderDays: (anniversary.reminderDays as number[]) ?? []
  }
}

export function mapWishlistItem(item: WishlistItem) {
  return {
    id: item.id,
    title: item.title,
    note: item.note,
    status: wishlistStatusFromPrisma(item.status),
    priority: item.priority,
    linkedMemoryId: item.linkedMemoryId,
    linkedAnniversaryId: item.linkedAnniversaryId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  }
}

export function mapSessionUser(user: User & { membership?: Membership | null }) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    locale: localeFromPrisma(user.locale),
    theme: themeFromPrisma(user.theme),
    timeFormat: timeFormatFromPrisma(user.timeFormat),
    timezone: user.timezone,
    coupleSpaceId: user.membership?.coupleSpaceId ?? null,
    seatNumber: user.membership?.seatNumber ?? null
  }
}

export function mapPairingStatus(params: {
  membership: Membership | null
  invite: PairingInvite | null
  members: Array<Membership & { user: Pick<User, 'id' | 'displayName'> }>
  title?: string
  slug?: string
}) {
  return {
    isPaired: params.members.length === 2,
    seatNumber: params.membership?.seatNumber ?? null,
    inviteCode: params.invite?.code ?? null,
    inviteExpiresAt: params.invite?.expiresAt.toISOString() ?? null,
    coupleSpace: params.membership
      ? {
          id: params.membership.coupleSpaceId,
          title: params.title ?? 'LoverMemory',
          slug: params.slug ?? 'lover-memory',
          members: params.members.map((member) => ({
            userId: member.user.id,
            displayName: member.user.displayName,
            seatNumber: member.seatNumber
          }))
        }
      : null
  }
}

export function mapNotification(record: NotificationRecord) {
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    channel: record.channel.toLowerCase(),
    status: record.status.toLowerCase(),
    payload: record.payload ?? null,
    createdAt: record.createdAt.toISOString(),
    readAt: record.readAt?.toISOString() ?? null
  }
}
