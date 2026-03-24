import {
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Query,
  Res,
  ServiceUnavailableException
} from '@nestjs/common'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Response } from 'express'
import { PrismaService } from '../prisma/prisma.service.js'
import { CurrentUser } from '../security/current-user.decorator.js'
import type { AuthContext } from '../security/request.types.js'
import { requireCoupleSpace } from '../common/space.guard.js'
import { assetStorageTarget, isAssetVariant, type AssetVariant } from '../common/media.js'
import { createS3Client } from '../common/storage.js'

async function streamToBuffer(stream: any) {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

@Injectable()
class MediaService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private s3Client() {
    return createS3Client()
  }

  async sendAsset(auth: AuthContext, assetId: string, variant: AssetVariant, response: Response) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const asset = await this.prisma.memoryAsset.findFirst({
      where: {
        id: assetId,
        coupleSpaceId
      }
    })

    if (!asset) {
      throw new NotFoundException('Asset not found')
    }

    const client = this.s3Client()
    const bucket = process.env.S3_BUCKET!
    let target = assetStorageTarget(asset, variant)

    try {
      const object = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: target.key
        })
      )
      const body = await streamToBuffer(object.Body)

      response.setHeader('Content-Type', target.mimeType)
      response.setHeader('Content-Length', String(body.length))
      response.setHeader('Cache-Control', variant === 'original' ? 'private, max-age=300' : 'private, max-age=86400')
      response.setHeader('Content-Disposition', 'inline')
      response.send(body)
      return
    } catch (error) {
      if (variant === 'original') {
        throw new NotFoundException('Asset file not found')
      }
    }

    target = assetStorageTarget(asset, 'original')
    const fallbackObject = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: target.key
      })
    )
    const fallbackBody = await streamToBuffer(fallbackObject.Body)

    response.setHeader('Content-Type', target.mimeType)
    response.setHeader('Content-Length', String(fallbackBody.length))
    response.setHeader('Cache-Control', 'private, max-age=300')
    response.setHeader('Content-Disposition', 'inline')
    response.send(fallbackBody)
  }
}

@Controller('media')
class MediaController {
  constructor(@Inject(MediaService) private readonly mediaService: MediaService) {}

  @Get('assets/:assetId')
  viewAsset(
    @CurrentUser() auth: AuthContext,
    @Param('assetId') assetId: string,
    @Query('variant') variant: string | undefined,
    @Res() response: Response
  ) {
    return this.mediaService.sendAsset(auth, assetId, isAssetVariant(variant) ? variant : 'original', response)
  }
}

@Module({
  controllers: [MediaController],
  providers: [MediaService]
})
export class MediaModule {}
