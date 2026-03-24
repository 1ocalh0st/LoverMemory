import { describe, expect, it } from 'vitest'
import { assetMediaPath, assetStorageTarget, assetVariantUrls, isAssetVariant } from './media.js'

describe('media helpers', () => {
  it('builds protected media urls', () => {
    expect(assetMediaPath('asset_123')).toBe('/api/media/assets/asset_123')
    expect(assetVariantUrls('asset_123')).toEqual({
      sm: '/api/media/assets/asset_123?variant=sm',
      md: '/api/media/assets/asset_123?variant=md',
      lg: '/api/media/assets/asset_123?variant=lg'
    })
  })

  it('derives object keys for generated variants', () => {
    expect(assetStorageTarget({ storageKey: 'space/user/photo.jpg', mimeType: 'image/jpeg' }, 'original')).toEqual({
      key: 'space/user/photo.jpg',
      mimeType: 'image/jpeg'
    })
    expect(assetStorageTarget({ storageKey: 'space/user/photo.jpg', mimeType: 'image/jpeg' }, 'md')).toEqual({
      key: 'space/user/photo-md.webp',
      mimeType: 'image/webp'
    })
    expect(assetStorageTarget({ storageKey: 'space/user/photo.jpg', mimeType: 'image/jpeg' }, 'lg')).toEqual({
      key: 'space/user/photo-lg.avif',
      mimeType: 'image/avif'
    })
  })

  it('validates supported variants', () => {
    expect(isAssetVariant('original')).toBe(true)
    expect(isAssetVariant('sm')).toBe(true)
    expect(isAssetVariant('md')).toBe(true)
    expect(isAssetVariant('lg')).toBe(true)
    expect(isAssetVariant('xl')).toBe(false)
    expect(isAssetVariant(undefined)).toBe(false)
  })
})
