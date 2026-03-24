import { S3Client } from '@aws-sdk/client-s3'
import { ServiceUnavailableException } from '@nestjs/common'

export function getPublicS3Endpoint() {
  return process.env.S3_ENDPOINT
}

export function getInternalS3Endpoint() {
  return process.env.S3_INTERNAL_ENDPOINT ?? process.env.S3_ENDPOINT
}

export function getAssetBaseUrl() {
  return process.env.ASSET_BASE_URL ?? `${getPublicS3Endpoint()}/${process.env.S3_BUCKET}`
}

export function createS3Client(options?: { endpoint?: string }) {
  const endpoint = options?.endpoint ?? getInternalS3Endpoint()
  if (!process.env.S3_BUCKET || !endpoint) {
    throw new ServiceUnavailableException('Object storage is not configured')
  }

  return new S3Client({
    region: process.env.S3_REGION ?? 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? '',
      secretAccessKey: process.env.S3_SECRET_KEY ?? ''
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
  })
}
