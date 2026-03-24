import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../prisma/prisma.service.js'
import { IS_PUBLIC_KEY } from './public.decorator.js'
import { sha256 } from './auth-utils.js'
import type { AuthenticatedRequest } from './request.types.js'

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = request.cookies?.lm_session as string | undefined

    if (!token) {
      if (isPublic) {
        return true
      }
      throw new UnauthorizedException('Authentication required')
    }

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: sha256(token) },
      include: {
        user: {
          include: {
            membership: true
          }
        }
      }
    })

    if (!session || session.expiresAt < new Date()) {
      if (isPublic) {
        return true
      }
      throw new UnauthorizedException('Session expired')
    }

    request.auth = {
      userId: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      locale: session.user.locale,
      theme: session.user.theme,
      timeFormat: session.user.timeFormat,
      timezone: session.user.timezone,
      coupleSpaceId: session.user.membership?.coupleSpaceId ?? null,
      role: session.user.membership?.role ?? null,
      seatNumber: session.user.membership?.seatNumber ?? null
    }

    return true
  }
}
