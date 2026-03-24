import { BadRequestException, Body, Controller, Delete, Get, Inject, Injectable, Module, Param, Patch, Post } from '@nestjs/common'
import { IsArray, IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { PrismaService } from '../prisma/prisma.service.js'
import { CurrentUser } from '../security/current-user.decorator.js'
import type { AuthContext } from '../security/request.types.js'
import { requireCoupleSpace } from '../common/space.guard.js'
import { mapAnniversary } from '../common/mappers.js'
import { prismaAnniversaryType } from '../common/domain.js'

class AnniversaryMutationDto {
  @IsString()
  @MaxLength(120)
  title!: string

  @IsOptional()
  @IsString()
  note?: string

  @IsDateString()
  targetDate!: string

  @IsString()
  @IsIn(['countdown', 'countup'])
  type!: string

  @IsArray()
  reminderDays!: number[]
}

@Injectable()
class AnniversariesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(auth: AuthContext) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const anniversaries = await this.prisma.anniversary.findMany({
      where: { coupleSpaceId },
      orderBy: { targetDate: 'asc' }
    })
    return {
      items: anniversaries.map(mapAnniversary)
    }
  }

  async create(auth: AuthContext, input: AnniversaryMutationDto) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const anniversary = await this.prisma.anniversary.create({
      data: {
        coupleSpaceId,
        title: input.title,
        note: input.note,
        targetDate: new Date(input.targetDate),
        type: prismaAnniversaryType(input.type),
        reminderDays: input.reminderDays
      }
    })
    return mapAnniversary(anniversary)
  }

  async update(auth: AuthContext, id: string, input: Partial<AnniversaryMutationDto>) {
    const coupleSpaceId = requireCoupleSpace(auth)
    const existing = await this.prisma.anniversary.findFirst({
      where: { id, coupleSpaceId }
    })
    if (!existing) {
      throw new BadRequestException('Anniversary not found')
    }
    const anniversary = await this.prisma.anniversary.update({
      where: { id },
      data: {
        title: input.title,
        note: input.note,
        targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        type: input.type ? prismaAnniversaryType(input.type) : undefined,
        reminderDays: input.reminderDays
      }
    })
    return mapAnniversary(anniversary)
  }

  async remove(auth: AuthContext, id: string) {
    const coupleSpaceId = requireCoupleSpace(auth)
    await this.prisma.anniversary.deleteMany({
      where: { id, coupleSpaceId }
    })
    return { deleted: true }
  }
}

@Controller('anniversaries')
class AnniversariesController {
  constructor(@Inject(AnniversariesService) private readonly anniversariesService: AnniversariesService) {}

  @Get()
  list(@CurrentUser() auth: AuthContext) {
    return this.anniversariesService.list(auth)
  }

  @Post()
  create(@CurrentUser() auth: AuthContext, @Body() body: AnniversaryMutationDto) {
    return this.anniversariesService.create(auth, body)
  }

  @Patch(':id')
  update(@CurrentUser() auth: AuthContext, @Param('id') id: string, @Body() body: Partial<AnniversaryMutationDto>) {
    return this.anniversariesService.update(auth, id, body)
  }

  @Delete(':id')
  remove(@CurrentUser() auth: AuthContext, @Param('id') id: string) {
    return this.anniversariesService.remove(auth, id)
  }
}

@Module({
  controllers: [AnniversariesController],
  providers: [AnniversariesService]
})
export class AnniversariesModule {}
