import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth.module.js'
import { PairingModule } from './pairing.module.js'
import { MemoriesModule } from './memories.module.js'
import { UploadsModule } from './uploads.module.js'
import { GalleryModule } from './gallery.module.js'
import { MediaModule } from './media.module.js'
import { AnniversariesModule } from './anniversaries.module.js'
import { WishlistModule } from './wishlist.module.js'
import { NotificationsModule } from './notifications.module.js'
import { SettingsModule } from './settings.module.js'
import { HomeModule } from './home.module.js'
import { PrismaModule } from '../prisma/prisma.module.js'
import { SessionGuard } from '../security/session.guard.js'
import { CsrfGuard } from '../security/csrf.guard.js'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PairingModule,
    MemoriesModule,
    UploadsModule,
    GalleryModule,
    MediaModule,
    AnniversariesModule,
    WishlistModule,
    NotificationsModule,
    SettingsModule,
    HomeModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SessionGuard
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard
    }
  ]
})
export class AppModule {}
