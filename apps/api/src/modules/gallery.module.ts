import { Controller, Get, Injectable, Module, Query } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CurrentUser } from '../security/current-user.decorator.js'
import type { AuthContext } from '../security/request.types.js'
import { requireCoupleSpace } from '../common/space.guard.js'
import { mapMemoryAsset } from '../common/mappers.js'

@Injectable()
class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(auth: AuthContext, page = 1, limit = 24) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const take = Math.min(limit, 60)
    const skip = Math.max(0, page - 1) * take
    const [total, assets] = await Promise.all([
      this.prisma.memoryAsset.count({
        where: {
          coupleSpaceId,
          memoryId: { not: null }
        }
      }),
      this.prisma.memoryAsset.findMany({
        where: {
          coupleSpaceId,
          memoryId: { not: null }
        },
        include: {
          memory: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ])

    return {
      items: assets.map((asset: any) => ({
        ...mapMemoryAsset(asset),
        memory: asset.memory
          ? {
              id: asset.memory.id,
              title: asset.memory.title,
              occurredAt: asset.memory.occurredAt.toISOString()
            }
          : null
      })),
      total,
      page,
      limit: take
    }
  }
}

@Controller('gallery')
class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  list(@CurrentUser() auth: AuthContext, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.galleryService.list(auth, Number(page ?? 1), Number(limit ?? 24))
  }
}

@Module({
  controllers: [GalleryController],
  providers: [GalleryService]
})
export class GalleryModule {}
