import { Body, Controller, Get, Inject, Injectable, Module, Patch } from '@nestjs/common'
import { IsIn, IsOptional, IsString } from 'class-validator'
import { PrismaService } from '../prisma/prisma.service.js'
import { CurrentUser } from '../security/current-user.decorator.js'
import type { AuthContext } from '../security/request.types.js'
import { mapSessionUser } from '../common/mappers.js'
import { prismaLocale, prismaTheme, prismaTimeFormat } from '../common/domain.js'

class PreferencesDto {
  @IsOptional()
  @IsString()
  @IsIn(['en', 'zh'])
  locale?: string

  @IsOptional()
  @IsString()
  @IsIn(['system', 'light', 'dark'])
  theme?: string

  @IsOptional()
  @IsString()
  @IsIn(['12h', '24h'])
  timeFormat?: string

  @IsOptional()
  @IsString()
  timezone?: string

  @IsOptional()
  @IsString()
  displayName?: string
}

@Injectable()
class SettingsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async get(auth: AuthContext) {
    const user = await this.prisma.user.findUnique({
      where: { id: auth.userId },
      include: { membership: true }
    })
    return mapSessionUser(user!)
  }

  async update(auth: AuthContext, input: PreferencesDto) {
    const user = await this.prisma.user.update({
      where: { id: auth.userId },
      data: {
        locale: input.locale ? prismaLocale(input.locale) : undefined,
        theme: input.theme ? prismaTheme(input.theme) : undefined,
        timeFormat: input.timeFormat ? prismaTimeFormat(input.timeFormat) : undefined,
        timezone: input.timezone,
        displayName: input.displayName
      },
      include: { membership: true }
    })
    return mapSessionUser(user)
  }
}

@Controller('settings/preferences')
class SettingsController {
  constructor(@Inject(SettingsService) private readonly settingsService: SettingsService) {}

  @Get()
  get(@CurrentUser() auth: AuthContext) {
    return this.settingsService.get(auth)
  }

  @Patch()
  update(@CurrentUser() auth: AuthContext, @Body() body: PreferencesDto) {
    return this.settingsService.update(auth, body)
  }
}

@Module({
  controllers: [SettingsController],
  providers: [SettingsService]
})
export class SettingsModule {}
