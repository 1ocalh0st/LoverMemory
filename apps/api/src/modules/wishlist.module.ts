import { BadRequestException, Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post } from '@nestjs/common'
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { PrismaService } from '../prisma/prisma.service.js'
import { CurrentUser } from '../security/current-user.decorator.js'
import type { AuthContext } from '../security/request.types.js'
import { requireCoupleSpace } from '../common/space.guard.js'
import { mapWishlistItem } from '../common/mappers.js'
import { prismaWishlistStatus } from '../common/domain.js'

class WishlistMutationDto {
  @IsString()
  title!: string

  @IsOptional()
  @IsString()
  note?: string

  @IsString()
  @IsIn(['dreaming', 'planning', 'completed'])
  status!: string

  @IsInt()
  @Min(1)
  @Max(3)
  priority!: number

  @IsOptional()
  @IsString()
  linkedMemoryId?: string

  @IsOptional()
  @IsString()
  linkedAnniversaryId?: string
}

@Injectable()
class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(auth: AuthContext) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const items = await this.prisma.wishlistItem.findMany({
      where: { coupleSpaceId },
      orderBy: [{ status: 'asc' }, { priority: 'asc' }, { createdAt: 'desc' }]
    })
    return { items: items.map(mapWishlistItem) }
  }

  async create(auth: AuthContext, input: WishlistMutationDto) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const item = await this.prisma.wishlistItem.create({
      data: {
        coupleSpaceId,
        authorId: auth.userId,
        title: input.title,
        note: input.note,
        status: prismaWishlistStatus(input.status),
        priority: input.priority,
        linkedMemoryId: input.linkedMemoryId,
        linkedAnniversaryId: input.linkedAnniversaryId
      }
    })
    return mapWishlistItem(item)
  }

  async update(auth: AuthContext, id: string, input: Partial<WishlistMutationDto>) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const existing = await this.prisma.wishlistItem.findFirst({
      where: { id, coupleSpaceId }
    })
    if (!existing) {
      throw new BadRequestException('Wishlist item not found')
    }
    const item = await this.prisma.wishlistItem.update({
      where: { id },
      data: {
        title: input.title,
        note: input.note,
        status: input.status ? prismaWishlistStatus(input.status) : undefined,
        priority: input.priority,
        linkedMemoryId: input.linkedMemoryId,
        linkedAnniversaryId: input.linkedAnniversaryId
      }
    })
    return mapWishlistItem(item)
  }

  async remove(auth: AuthContext, id: string) {
    const coupleSpaceId = requireCoupleSpace(auth)
    await this.prisma.wishlistItem.deleteMany({
      where: { id, coupleSpaceId }
    })
    return { deleted: true }
  }
}

@Controller('wishlist')
class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  list(@CurrentUser() auth: AuthContext) {
    return this.wishlistService.list(auth)
  }

  @Post()
  create(@CurrentUser() auth: AuthContext, @Body() body: WishlistMutationDto) {
    return this.wishlistService.create(auth, body)
  }

  @Patch(':id')
  update(@CurrentUser() auth: AuthContext, @Param('id') id: string, @Body() body: Partial<WishlistMutationDto>) {
    return this.wishlistService.update(auth, id, body)
  }

  @Delete(':id')
  remove(@CurrentUser() auth: AuthContext, @Param('id') id: string) {
    return this.wishlistService.remove(auth, id)
  }
}

@Module({
  controllers: [WishlistController],
  providers: [WishlistService]
})
export class WishlistModule {}
