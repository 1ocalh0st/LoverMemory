import { BadRequestException } from '@nestjs/common'
import type { AuthContext } from '../security/request.types.js'

export function requireCoupleSpace(auth?: AuthContext) {
  if (!auth?.coupleSpaceId) {
    throw new BadRequestException('Pairing must be completed first')
  }
  return auth.coupleSpaceId
}
