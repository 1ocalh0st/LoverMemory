import { Body, Controller, Delete, Get, HttpCode, Inject, Injectable, Module, Param, Patch, Post } from '@nestjs/common'
import { IsNotEmpty, IsObject, IsString } from 'class-validator'
import webPush from 'web-push'
import { PrismaService } from '../prisma/prisma.service.js'
import { CurrentUser } from '../security/current-user.decorator.js'
import type { AuthContext } from '../security/request.types.js'
import { mapNotification } from '../common/mappers.js'

class SubscriptionKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh!: string

  @IsString()
  @IsNotEmpty()
  auth!: string
}

class PushSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  endpoint!: string

  @IsObject()
  keys!: SubscriptionKeysDto
}

@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
      webPush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      )
    }
  }

  async list(auth: AuthContext) {
    const items = await this.prisma.notificationRecord.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 30
    })

    return { items: items.map(mapNotification) }
  }

  async subscribe(auth: AuthContext, subscription: PushSubscriptionDto, userAgent?: string) {
    const record = await this.prisma.notificationSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId: auth.userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent
      },
      create: {
        userId: auth.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent
      }
    })
    return { id: record.id }
  }

  async unsubscribe(auth: AuthContext, endpoint: string) {
    await this.prisma.notificationSubscription.deleteMany({
      where: {
        userId: auth.userId,
        endpoint
      }
    })
    return { deleted: true }
  }

  async markAsRead(auth: AuthContext, notificationId: string) {
    await this.prisma.notificationRecord.updateMany({
      where: {
        id: notificationId,
        userId: auth.userId
      },
      data: {
        readAt: new Date(),
        status: 'READ'
      }
    })
    return { updated: true }
  }
}

@Controller('notifications')
class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() auth: AuthContext) {
    return this.notificationsService.list(auth)
  }

  @Post('subscriptions')
  subscribe(@CurrentUser() auth: AuthContext, @Body() body: PushSubscriptionDto) {
    return this.notificationsService.subscribe(auth, body)
  }

  @Delete('subscriptions')
  @HttpCode(204)
  async unsubscribe(@CurrentUser() auth: AuthContext, @Body('endpoint') endpoint: string) {
    await this.notificationsService.unsubscribe(auth, endpoint)
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() auth: AuthContext, @Param('id') id: string) {
    return this.notificationsService.markAsRead(auth, id)
  }
}

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
