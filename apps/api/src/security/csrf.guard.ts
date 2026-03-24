import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../prisma/prisma.service.js'
import { IS_PUBLIC_KEY } from './public.decorator.js'
import { cookieOptions, randomToken } from './auth-utils.js'
import type { AuthenticatedRequest } from './request.types.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

@Injectable()
export class CsrfGuard implements CanActivate {
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
    const response = context.switchToHttp().getResponse()

    const csrfCookie = request.cookies?.lm_csrf as string | undefined
    if (!csrfCookie) {
      response.cookie('lm_csrf', randomToken(24), cookieOptions(false))
    }

    if (SAFE_METHODS.has(request.method)) {
      return true
    }

    if (isPublic && request.path.includes('/auth/passkeys/')) {
      return true
    }

    const headerToken = request.headers['x-csrf-token']
    const effectiveToken = Array.isArray(headerToken) ? headerToken[0] : headerToken
    if (!csrfCookie || !effectiveToken || csrfCookie !== effectiveToken) {
      throw new ForbiddenException('Invalid CSRF token')
    }

    return true
  }
}
