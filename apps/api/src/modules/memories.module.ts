import { BadRequestException, Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Query } from '@nestjs/common'
import { IsArray, IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator'
import { PrismaService } from '../prisma/prisma.service.js'
import { CurrentUser } from '../security/current-user.decorator.js'
import type { AuthContext } from '../security/request.types.js'
import { mapMemory } from '../common/mappers.js'
import { prismaMood } from '../common/domain.js'
import { requireCoupleSpace } from '../common/space.guard.js'

class MemoryMutationDto {
  @IsString()
  @MaxLength(120)
  title!: string

  @IsString()
  story!: string

  @IsDateString()
  occurredAt!: string

  @IsString()
  @IsIn(['romantic', 'happy', 'peaceful', 'excited', 'nostalgic', 'grateful', 'tender'])
  mood!: string

  @IsOptional()
  @IsString()
  @MaxLength(140)
  locationName?: string

  @IsOptional()
  @IsNumber()
  latitude?: number

  @IsOptional()
  @IsNumber()
  longitude?: number

  @IsOptional()
  @IsArray()
  assetIds?: string[]

  @IsOptional()
  @IsString()
  coverAssetId?: string
}

@Injectable()
class MemoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(auth: AuthContext, query: { q?: string; mood?: string; from?: string; to?: string }) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const memories = await this.prisma.memory.findMany({
      where: {
        coupleSpaceId,
        mood: query.mood ? prismaMood(query.mood) : undefined,
        occurredAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined
        },
        OR: query.q
          ? [
              { title: { contains: query.q } },
              { story: { contains: query.q } },
              { locationName: { contains: query.q } }
            ]
          : undefined
      },
      include: {
        coverAsset: true,
        assets: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortAt: 'desc' }
    })

    return {
      items: memories.map(mapMemory)
    }
  }

  async create(auth: AuthContext, input: MemoryMutationDto) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const assetIds = input.assetIds ?? []
    const occurredAt = new Date(input.occurredAt)
    const assets = assetIds.length
      ? await this.prisma.memoryAsset.findMany({
          where: {
            id: { in: assetIds },
            coupleSpaceId
          }
        })
      : []

    if (assetIds.length && assets.length !== assetIds.length) {
      throw new BadRequestException('One or more assets were not found')
    }

    const memory = await this.prisma.memory.create({
      data: {
        coupleSpaceId,
        authorId: auth.userId,
        title: input.title,
        story: input.story,
        occurredAt,
        sortAt: occurredAt,
        mood: prismaMood(input.mood),
        locationName: input.locationName,
        latitude: input.latitude,
        longitude: input.longitude,
        coverAssetId: input.coverAssetId
      }
    })

    if (assetIds.length) {
      await Promise.all(
        assetIds.map((assetId, index) =>
          this.prisma.memoryAsset.update({
            where: { id: assetId },
            data: {
              memoryId: memory.id,
              sortOrder: index,
              isCover: assetId === input.coverAssetId
            }
          })
        )
      )
    }

    return this.getById(coupleSpaceId, memory.id)
  }

  async update(auth: AuthContext, memoryId: string, input: Partial<MemoryMutationDto>) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const existing = await this.prisma.memory.findFirst({
      where: {
        id: memoryId,
        coupleSpaceId
      }
    })
    if (!existing) {
      throw new BadRequestException('Memory not found')
    }

    if (input.assetIds) {
      await this.prisma.memoryAsset.updateMany({
        where: { memoryId },
        data: { isCover: false }
      })
      await Promise.all(
        input.assetIds.map((assetId, index) =>
          this.prisma.memoryAsset.update({
            where: { id: assetId },
            data: {
              memoryId,
              sortOrder: index,
              isCover: assetId === input.coverAssetId
            }
          })
        )
      )
    }

    await this.prisma.memory.update({
      where: { id: memoryId },
      data: {
        title: input.title,
        story: input.story,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
        sortAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
        mood: input.mood ? prismaMood(input.mood) : undefined,
        locationName: input.locationName,
        latitude: input.latitude,
        longitude: input.longitude,
        coverAssetId: input.coverAssetId
      }
    })

    return this.getById(coupleSpaceId, memoryId)
  }

  async remove(auth: AuthContext, memoryId: string) {
    const coupleSpaceId = requireCoupleSpace(auth)
    await this.prisma.memory.deleteMany({
      where: {
        id: memoryId,
        coupleSpaceId
      }
    })
    return { deleted: true }
  }

  async getById(coupleSpaceId: string, memoryId: string) {
    const memory = await this.prisma.memory.findFirst({
      where: {
        id: memoryId,
        coupleSpaceId
      },
      include: {
        coverAsset: true,
        assets: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })
    if (!memory) {
      throw new BadRequestException('Memory not found')
    }
    return mapMemory(memory)
  }
}

@Controller('memories')
class MemoriesController {
  constructor(private readonly memoriesService: MemoriesService) {}

  @Get()
  list(
    @CurrentUser() auth: AuthContext,
    @Query('q') q?: string,
    @Query('mood') mood?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.memoriesService.list(auth, { q, mood, from, to })
  }

  @Post()
  create(@CurrentUser() auth: AuthContext, @Body() body: MemoryMutationDto) {
    return this.memoriesService.create(auth, body)
  }

  @Patch(':id')
  update(@CurrentUser() auth: AuthContext, @Param('id') id: string, @Body() body: Partial<MemoryMutationDto>) {
    return this.memoriesService.update(auth, id, body)
  }

  @Delete(':id')
  remove(@CurrentUser() auth: AuthContext, @Param('id') id: string) {
    return this.memoriesService.remove(auth, id)
  }
}

@Module({
  controllers: [MemoriesController],
  providers: [MemoriesService]
})
export class MemoriesModule {}
