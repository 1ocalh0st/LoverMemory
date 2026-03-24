import type { MemoryAsset } from '@prisma/client'

export const mediaVariantConfig = {
  sm: { suffix: '-sm.webp', mimeType: 'image/webp' },
  md: { suffix: '-md.webp', mimeType: 'image/webp' },
  lg: { suffix: '-lg.avif', mimeType: 'image/avif' }
} as const

export type AssetVariant = 'original' | keyof typeof mediaVariantConfig

export function isAssetVariant(value: string | undefined): value is AssetVariant {
  return value === 'original' || value === 'sm' || value === 'md' || value === 'lg'
}

export function assetMediaPath(assetId: string, variant: AssetVariant = 'original') {
  return variant === 'original' ? `/api/media/assets/${assetId}` : `/api/media/assets/${assetId}?variant=${variant}`
}

export function assetVariantUrls(assetId: string) {
  return {
    sm: assetMediaPath(assetId, 'sm'),
    md: assetMediaPath(assetId, 'md'),
    lg: assetMediaPath(assetId, 'lg')
  }
}

export function assetStorageTarget(
  asset: Pick<MemoryAsset, 'storageKey' | 'mimeType'>,
  variant: AssetVariant = 'original'
) {
  if (variant === 'original') {
    return {
      key: asset.storageKey,
      mimeType: asset.mimeType
    }
  }

  const baseKey = asset.storageKey.replace(/\.[^.]+$/, '')
  return {
    key: `${baseKey}${mediaVariantConfig[variant].suffix}`,
    mimeType: mediaVariantConfig[variant].mimeType
  }
}
