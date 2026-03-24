import { Controller, Get, Injectable, Module } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CurrentUser } from '../security/current-user.decorator.js'
import type { AuthContext } from '../security/request.types.js'
import { requireCoupleSpace } from '../common/space.guard.js'
import { calculateCountdown, getNextOccurrence } from '../common/anniversary.js'
import { mapMemory } from '../common/mappers.js'

@Injectable()
class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(auth: AuthContext) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const [memoryCount, anniversaryCount, wishlistStats, recentMemories, featuredMemory, anniversaries] = await Promise.all([
      this.prisma.memory.count({ where: { coupleSpaceId } }),
      this.prisma.anniversary.count({ where: { coupleSpaceId } }),
      this.prisma.wishlistItem.groupBy({
        by: ['status'],
        where: { coupleSpaceId },
        _count: { _all: true }
      }),
      this.prisma.memory.findMany({
        where: { coupleSpaceId },
        include: {
          coverAsset: true,
          assets: { orderBy: { sortOrder: 'asc' } }
        },
        orderBy: { sortAt: 'desc' },
        take: 4
      }),
      this.prisma.memory.findFirst({
        where: {
          coupleSpaceId,
          coverAssetId: { not: null }
        },
        include: {
          coverAsset: true,
          assets: { orderBy: { sortOrder: 'asc' } }
        },
        orderBy: { sortAt: 'desc' }
      }),
      this.prisma.anniversary.findMany({
        where: { coupleSpaceId },
        orderBy: { targetDate: 'asc' }
      })
    ])

    const nextAnniversary = anniversaries
      .map((item: any) => ({
        ...item,
        daysLeft: calculateCountdown(getNextOccurrence(item.targetDate))
      }))
      .sort((a: any, b: any) => a.daysLeft - b.daysLeft)[0]

    return {
      stats: {
        memoryCount,
        anniversaryCount,
        wishlistDreaming: wishlistStats.find((item: any) => item.status === 'DREAMING')?._count._all ?? 0,
        wishlistCompleted: wishlistStats.find((item: any) => item.status === 'COMPLETED')?._count._all ?? 0
      },
      featuredMemory: featuredMemory ? mapMemory(featuredMemory) : null,
      recentMemories: recentMemories.map(mapMemory),
      nextAnniversary: nextAnniversary
        ? {
            id: nextAnniversary.id,
            title: nextAnniversary.title,
            targetDate: nextAnniversary.targetDate.toISOString(),
            daysLeft: nextAnniversary.daysLeft
          }
        : null
    }
  }
}

@Controller('home')
class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  get(@CurrentUser() auth: AuthContext) {
    return this.homeService.getDashboard(auth)
  }
}

@Module({
  controllers: [HomeController],
  providers: [HomeService]
})
export class HomeModule {}
