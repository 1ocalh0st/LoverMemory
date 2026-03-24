import { BadRequestException, Body, Controller, Get, Injectable, Module, Post } from '@nestjs/common'
import { MembershipRole, MembershipStatus } from '@prisma/client'
import { IsNotEmpty, IsString } from 'class-validator'
import slugify from 'slugify'
import { PrismaService } from '../prisma/prisma.service.js'
import { CurrentUser } from '../security/current-user.decorator.js'
import type { AuthContext } from '../security/request.types.js'
import { mapPairingStatus } from '../common/mappers.js'
import { randomToken } from '../security/auth-utils.js'

class JoinPairDto {
  @IsString()
  @IsNotEmpty()
  code!: string
}

@Injectable()
class PairingService {
  constructor(private readonly prisma: PrismaService) {}

  private async getStatusForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        membership: {
          include: {
            coupleSpace: {
              include: {
                memberships: {
                  where: { status: MembershipStatus.ACTIVE },
                  include: { user: { select: { id: true, displayName: true } } }
                },
                invites: {
                  where: {
                    usedAt: null,
                    expiresAt: { gt: new Date() }
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      }
    })

    const membership = user?.membership ?? null
    const coupleSpace = membership?.coupleSpace ?? null

    return mapPairingStatus({
      membership,
      invite: coupleSpace?.invites[0] ?? null,
      members: coupleSpace?.memberships ?? [],
      title: coupleSpace?.title,
      slug: coupleSpace?.slug
    })
  }

  async status(auth: AuthContext) {
    return this.getStatusForUser(auth.userId)
  }

  async createInvite(auth: AuthContext) {
    const user = await this.prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        membership: {
          include: {
            coupleSpace: {
              include: {
                memberships: {
                  where: { status: MembershipStatus.ACTIVE }
                }
              }
            }
          }
        }
      }
    })

    let membership: { role: MembershipRole; coupleSpaceId: string } | null = user?.membership
      ? {
          role: user.membership.role,
          coupleSpaceId: user.membership.coupleSpaceId
        }
      : null
    if (!membership) {
      const slugBase = slugify(user?.displayName ?? user?.email.split('@')[0] ?? 'lover-memory', {
        lower: true,
        strict: true
      })
      const coupleSpace = await this.prisma.coupleSpace.create({
        data: {
          title: 'Our Memory Space',
          slug: `${slugBase}-${randomToken(4).toLowerCase()}`,
          createdById: auth.userId,
          memberships: {
            create: {
              userId: auth.userId,
              role: MembershipRole.OWNER,
              status: MembershipStatus.ACTIVE,
              seatNumber: 1
            }
          }
        },
        include: {
          memberships: true
        }
      })
      membership = {
        role: coupleSpace.memberships[0].role,
        coupleSpaceId: coupleSpace.memberships[0].coupleSpaceId
      }
    }

    if (!membership || membership.role !== MembershipRole.OWNER) {
      throw new BadRequestException('Only the owner can create pairing invites')
    }

    const memberCount = await this.prisma.membership.count({
      where: {
        coupleSpaceId: membership.coupleSpaceId,
        status: MembershipStatus.ACTIVE
      }
    })

    if (memberCount >= 2) {
      throw new BadRequestException('This private space is already full')
    }

    await this.prisma.pairingInvite.updateMany({
      where: {
        coupleSpaceId: membership.coupleSpaceId,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      data: {
        expiresAt: new Date()
      }
    })

    const invite = await this.prisma.pairingInvite.create({
      data: {
        coupleSpaceId: membership.coupleSpaceId,
        createdById: auth.userId,
        code: randomToken(6).slice(0, 8).toUpperCase(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      }
    })

    return {
      code: invite.code,
      expiresAt: invite.expiresAt.toISOString()
    }
  }

  async join(auth: AuthContext, code: string) {
    const existingMembership = await this.prisma.membership.findUnique({
      where: { userId: auth.userId }
    })
    if (existingMembership) {
      throw new BadRequestException('This account already belongs to a private space')
    }

    const invite = await this.prisma.pairingInvite.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        coupleSpace: {
          include: {
            memberships: {
              where: { status: MembershipStatus.ACTIVE }
            }
          }
        }
      }
    })

    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite code is invalid or expired')
    }

    if (invite.coupleSpace.memberships.length >= 2) {
      throw new BadRequestException('This private space is already full')
    }

    await this.prisma.$transaction([
      this.prisma.membership.create({
        data: {
          userId: auth.userId,
          coupleSpaceId: invite.coupleSpaceId,
          role: MembershipRole.PARTNER,
          status: MembershipStatus.ACTIVE,
          seatNumber: 2
        }
      }),
      this.prisma.pairingInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() }
      })
    ])

    return this.getStatusForUser(auth.userId)
  }
}

@Controller('pairing')
class PairingController {
  constructor(private readonly pairingService: PairingService) {}

  @Get('status')
  status(@CurrentUser() auth: AuthContext) {
    return this.pairingService.status(auth)
  }

  @Post('invite')
  invite(@CurrentUser() auth: AuthContext) {
    return this.pairingService.createInvite(auth)
  }

  @Post('join')
  join(@CurrentUser() auth: AuthContext, @Body() body: JoinPairDto) {
    return this.pairingService.join(auth, body.code)
  }
}

@Module({
  controllers: [PairingController],
  providers: [PairingService]
})
export class PairingModule {}
