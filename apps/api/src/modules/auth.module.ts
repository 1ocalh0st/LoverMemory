import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Injectable,
  Module,
  Post,
  Res,
  ServiceUnavailableException,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server'
import type { Response } from 'express'
import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  SESSION_MAX_AGE_MS,
  clearCookieOptions,
  cookieOptions,
  normalizeDisplayName,
  normalizeEmail,
  parseLoginIdentifier,
  randomToken,
  sha256
} from '../security/auth-utils.js'
import { CurrentUser } from '../security/current-user.decorator.js'
import { Public } from '../security/public.decorator.js'
import type { AuthContext } from '../security/request.types.js'
import { mapSessionUser } from '../common/mappers.js'
import { prismaLocale } from '../common/domain.js'

class RegisterStartDto {
  @IsEmail()
  email!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  displayName!: string

  @IsOptional()
  @IsString()
  locale?: string

  @IsOptional()
  @IsString()
  timezone?: string
}

class RegisterFinishDto {
  @IsEmail()
  email!: string

  @IsObject()
  credential!: Record<string, unknown>
}

class LoginStartDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string
}

class LoginFinishDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string

  @IsObject()
  credential!: Record<string, unknown>
}

class RecoveryRequestDto {
  @IsEmail()
  email!: string
}

class RecoveryVerifyDto {
  @IsString()
  @IsNotEmpty()
  token!: string
}

@Injectable()
class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService
  ) {}

  private get rpID() {
    return this.config.get('RP_ID') ?? 'localhost'
  }

  private get rpOrigin() {
    return this.config.get('RP_ORIGIN') ?? 'http://localhost:5173'
  }

  private get appName() {
    return this.config.get('APP_NAME') ?? 'LoverMemory'
  }

  private get recoveryMode() {
    return process.env.NODE_ENV === 'production' ? 'disabled' : 'preview'
  }

  private async findUniqueUserByDisplayName(displayName: string, include?: Record<string, unknown>): Promise<any> {
    const users = await this.prisma.user.findMany({
      where: { displayName },
      include: include as any,
      take: 2
    })

    if (users.length > 1) {
      throw new BadRequestException('This display name is not unique, please sign in with email')
    }

    return users[0] ?? null
  }

  private async findUserForLogin(identifier: string, include?: Record<string, unknown>): Promise<any> {
    const parsed = parseLoginIdentifier(identifier)
    if (!parsed.value) {
      throw new BadRequestException('Name or email is required')
    }

    if (parsed.isEmail) {
      return this.prisma.user.findUnique({
        where: { email: parsed.value },
        include: include as any
      })
    }

    return this.findUniqueUserByDisplayName(parsed.value, include)
  }

  async createSession(userId: string, response: Response, meta?: { userAgent?: string; ipAddress?: string }) {
    const sessionToken = randomToken(48)
    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: sha256(sessionToken),
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
        expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS)
      }
    })
    response.cookie('lm_session', sessionToken, cookieOptions(true))
  }

  async registerStart(input: RegisterStartDto) {
    const email = normalizeEmail(input.email)
    const displayName = normalizeDisplayName(input.displayName)

    if (!displayName) {
      throw new BadRequestException('Display name is required')
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
      include: { passkeys: true }
    })

    const existingDisplayName = await this.prisma.user.findFirst({
      where: {
        displayName,
        NOT: { email }
      },
      select: { id: true }
    })

    if (existingDisplayName) {
      throw new BadRequestException('Display name is already in use')
    }

    if (existing && existing.passkeys.length > 0) {
      throw new BadRequestException('Account already exists, please sign in')
    }

    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            displayName,
            locale: prismaLocale(input.locale ?? 'zh'),
            timezone: input.timezone ?? 'Asia/Shanghai'
          }
        })
      : await this.prisma.user.create({
          data: {
            email,
            displayName,
            locale: prismaLocale(input.locale ?? 'zh'),
            timezone: input.timezone ?? 'Asia/Shanghai'
          }
        })

    const options = await generateRegistrationOptions({
      rpName: this.appName,
      rpID: this.rpID,
      userName: user.email,
      userDisplayName: user.displayName ?? user.email,
      userID: Buffer.from(user.id, 'utf8'),
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      },
      excludeCredentials: (existing?.passkeys ?? []).map((passkey: any) => ({
        id: passkey.credentialId,
        type: 'public-key'
      })) as any
    })

    await this.prisma.authChallenge.upsert({
      where: {
        userId_kind: {
          userId: user.id,
          kind: 'registration'
        }
      },
      update: {
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        rpId: this.rpID
      },
      create: {
        userId: user.id,
        kind: 'registration',
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        rpId: this.rpID
      }
    })

    return options
  }

  async registerFinish(input: RegisterFinishDto, response: Response, meta?: { userAgent?: string; ipAddress?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(input.email) },
      include: { authChallenges: true, membership: true }
    })

    if (!user) {
      throw new BadRequestException('Registration session not found')
    }

    const challenge = user.authChallenges.find((item: any) => item.kind === 'registration')
    if (!challenge || challenge.expiresAt < new Date()) {
      throw new BadRequestException('Registration challenge expired')
    }

    const verification = await verifyRegistrationResponse({
      response: input.credential as any,
      expectedChallenge: challenge.challenge,
      expectedOrigin: this.rpOrigin,
      expectedRPID: this.rpID,
      requireUserVerification: true
    })

    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException('Passkey registration failed')
    }

    const registrationInfo = verification.registrationInfo

    await this.prisma.$transaction([
      this.prisma.passkeyCredential.create({
        data: {
          userId: user.id,
          webAuthnUserId: user.id,
          credentialId: registrationInfo.credential.id,
          publicKey: Buffer.from(registrationInfo.credential.publicKey),
          counter: registrationInfo.credential.counter,
          deviceType: registrationInfo.credentialDeviceType,
          backedUp: registrationInfo.credentialBackedUp,
          transports: JSON.stringify((input.credential as any).response?.transports ?? []),
          label: user.displayName ?? user.email
        }
      }),
      this.prisma.authChallenge.delete({
        where: {
          userId_kind: {
            userId: user.id,
            kind: 'registration'
          }
        }
      })
    ])

    await this.createSession(user.id, response, meta)

    const freshUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { membership: true }
    })

    return {
      authenticated: true,
      user: mapSessionUser(freshUser!),
      needsPairing: !freshUser?.membership
    }
  }

  async loginStart(input: LoginStartDto) {
    const user = await this.findUserForLogin(input.identifier, { passkeys: true })

    if (!user || user.passkeys.length === 0) {
      throw new BadRequestException('No passkey found for this name or email')
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      userVerification: 'preferred',
      allowCredentials: user.passkeys.map((passkey: any) => ({
        id: passkey.credentialId,
        type: 'public-key'
      })) as any
    })

    await this.prisma.authChallenge.upsert({
      where: {
        userId_kind: {
          userId: user.id,
          kind: 'authentication'
        }
      },
      update: {
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        rpId: this.rpID
      },
      create: {
        userId: user.id,
        kind: 'authentication',
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        rpId: this.rpID
      }
    })

    return options
  }

  async loginFinish(input: LoginFinishDto, response: Response, meta?: { userAgent?: string; ipAddress?: string }) {
    const user = await this.findUserForLogin(input.identifier, {
      passkeys: true,
      authChallenges: true,
      membership: true
    })

    if (!user) {
      throw new BadRequestException('User not found')
    }

    const challenge = user.authChallenges.find((item: any) => item.kind === 'authentication')
    if (!challenge || challenge.expiresAt < new Date()) {
      throw new BadRequestException('Authentication challenge expired')
    }

    const credentialId = (input.credential as any).id as string
    const passkey = user.passkeys.find((item: any) => item.credentialId === credentialId)
    if (!passkey) {
      throw new BadRequestException('Passkey not registered')
    }

    const verification = await verifyAuthenticationResponse({
      response: input.credential as any,
      expectedChallenge: challenge.challenge,
      expectedOrigin: this.rpOrigin,
      expectedRPID: this.rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: Buffer.from(passkey.publicKey),
        counter: passkey.counter,
        transports: passkey.transports ? JSON.parse(passkey.transports) : undefined
      } as any,
      requireUserVerification: true
    })

    if (!verification.verified) {
      throw new UnauthorizedException('Passkey login failed')
    }

    await this.prisma.$transaction([
      this.prisma.passkeyCredential.update({
        where: { id: passkey.id },
        data: {
          counter: verification.authenticationInfo.newCounter,
          lastUsedAt: new Date()
        }
      }),
      this.prisma.authChallenge.delete({
        where: {
          userId_kind: {
            userId: user.id,
            kind: 'authentication'
          }
        }
      })
    ])

    await this.createSession(user.id, response, meta)

    const freshUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { membership: true }
    })

    return {
      authenticated: true,
      user: mapSessionUser(freshUser!),
      needsPairing: !freshUser?.membership
    }
  }

  async logout(userId: string, response: Response) {
    await this.prisma.session.deleteMany({
      where: { userId }
    })
    response.clearCookie('lm_session', clearCookieOptions(true))
  }

  async requestRecovery(input: RecoveryRequestDto) {
    if (this.recoveryMode !== 'preview') {
      throw new ServiceUnavailableException(
        'Recovery email is not available in this deployment yet. Sign in with a saved passkey, or use another device that already has access.'
      )
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(input.email) }
    })

    if (!user) {
      return { accepted: true }
    }

    const token = randomToken(24)
    await this.prisma.recoveryToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 30)
      }
    })

    return {
      accepted: true,
      previewToken: process.env.NODE_ENV === 'production' ? undefined : token
    }
  }

  async verifyRecovery(input: RecoveryVerifyDto) {
    const token = await this.prisma.recoveryToken.findUnique({
      where: { tokenHash: sha256(input.token) }
    })

    if (!token || token.expiresAt < new Date() || token.consumedAt) {
      throw new BadRequestException('Recovery token is invalid or expired')
    }

    return {
      valid: true
    }
  }

  async getSession(auth: AuthContext | undefined, csrfToken: string | undefined) {
    if (!auth) {
      return {
        authenticated: false,
        csrfToken,
        vapidPublicKey: this.config.get('VAPID_PUBLIC_KEY') ?? null,
        recoveryMode: this.recoveryMode
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: auth.userId },
      include: { membership: true }
    })

    return {
      authenticated: true,
      user: mapSessionUser(user!),
      csrfToken,
      vapidPublicKey: this.config.get('VAPID_PUBLIC_KEY') ?? null,
      recoveryMode: this.recoveryMode
    }
  }
}

@Controller()
class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Get('session')
  getSession(@CurrentUser() auth: AuthContext | undefined, @Res({ passthrough: true }) response: Response) {
    return this.authService.getSession(auth, response.req.cookies?.lm_csrf)
  }

  @Public()
  @Post('auth/passkeys/register/start')
  registerStart(@Body() body: RegisterStartDto) {
    return this.authService.registerStart(body)
  }

  @Public()
  @Post('auth/passkeys/register/finish')
  registerFinish(@Body() body: RegisterFinishDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.registerFinish(body, response, {
      userAgent: response.req.headers['user-agent'],
      ipAddress: response.req.ip
    })
  }

  @Public()
  @Post('auth/passkeys/login/start')
  loginStart(@Body() body: LoginStartDto) {
    return this.authService.loginStart(body)
  }

  @Public()
  @Post('auth/passkeys/login/finish')
  loginFinish(@Body() body: LoginFinishDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.loginFinish(body, response, {
      userAgent: response.req.headers['user-agent'],
      ipAddress: response.req.ip
    })
  }

  @Public()
  @Post('auth/recovery/request')
  recoveryRequest(@Body() body: RecoveryRequestDto) {
    return this.authService.requestRecovery(body)
  }

  @Public()
  @Post('auth/recovery/verify')
  recoveryVerify(@Body() body: RecoveryVerifyDto) {
    return this.authService.verifyRecovery(body)
  }

  @Delete('auth/session')
  @HttpCode(204)
  async logout(@CurrentUser() auth: AuthContext, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(auth.userId, response)
  }
}

@Module({
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
