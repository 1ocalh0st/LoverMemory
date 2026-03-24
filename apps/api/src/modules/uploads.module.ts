import { BadRequestException, Body, Controller, Injectable, Module, Post, ServiceUnavailableException } from '@nestjs/common'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { IsInt, IsMimeType, IsOptional, IsString, Max, Min } from 'class-validator'
import { PrismaService } from '../prisma/prisma.service.js'
import { CurrentUser } from '../security/current-user.decorator.js'
import type { AuthContext } from '../security/request.types.js'
import { requireCoupleSpace } from '../common/space.guard.js'
import { randomToken } from '../security/auth-utils.js'

class UploadPresignDto {
  @IsString()
  filename!: string

  @IsMimeType()
  mimeType!: string

  @IsInt()
  @Min(1)
  @Max(50_000_000)
  byteSize!: number

  @IsOptional()
  @IsInt()
  width?: number

  @IsOptional()
  @IsInt()
  height?: number
}

class UploadCompleteDto {
  @IsString()
  storageKey!: string

  @IsString()
  originalUrl!: string

  @IsMimeType()
  mimeType!: string

  @IsOptional()
  @IsInt()
  byteSize?: number

  @IsOptional()
  @IsInt()
  width?: number

  @IsOptional()
  @IsInt()
  height?: number
}

@Injectable()
class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  private s3Client() {
    if (!process.env.S3_BUCKET || !process.env.S3_ENDPOINT) {
      throw new ServiceUnavailableException('Object storage is not configured')
    }
    return new S3Client({
      region: process.env.S3_REGION ?? 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? '',
        secretAccessKey: process.env.S3_SECRET_KEY ?? ''
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
    })
  }

  async presign(auth: AuthContext, input: UploadPresignDto) {
    const coupleSpaceId = requireCoupleSpace(auth)
    if (!input.mimeType.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are supported')
    }

    const extension = input.filename.split('.').pop()?.toLowerCase() ?? 'jpg'
    const storageKey = `${coupleSpaceId}/${auth.userId}/${Date.now()}-${randomToken(6)}.${extension}`
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: storageKey,
      ContentType: input.mimeType
    })
    const uploadUrl = await getSignedUrl(this.s3Client(), command, { expiresIn: 60 * 10 })
    const publicUrlBase = process.env.ASSET_BASE_URL ?? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}`

    return {
      uploadUrl,
      storageKey,
      publicUrl: `${publicUrlBase}/${storageKey}`,
      headers: {
        'Content-Type': input.mimeType
      }
    }
  }

  async complete(auth: AuthContext, input: UploadCompleteDto) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const asset = await this.prisma.memoryAsset.create({
      data: {
        coupleSpaceId,
        authorId: auth.userId,
        storageKey: input.storageKey,
        originalUrl: input.originalUrl,
        mimeType: input.mimeType,
        byteSize: input.byteSize,
        width: input.width,
        height: input.height
      }
    })

    return {
      assetId: asset.id,
      asset
    }
  }
}

@Controller('uploads')
class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  presign(@CurrentUser() auth: AuthContext, @Body() body: UploadPresignDto) {
    return this.uploadsService.presign(auth, body)
  }

  @Post('complete')
  complete(@CurrentUser() auth: AuthContext, @Body() body: UploadCompleteDto) {
    return this.uploadsService.complete(auth, body)
  }
}

@Module({
  controllers: [UploadsController],
  providers: [UploadsService]
})
export class UploadsModule {}
