import { describe, expect, it } from 'vitest'
import { calculateCountdown, getReminderCandidates } from './anniversary.js'

describe('anniversary helpers', () => {
  it('calculates countdown in days', () => {
    const now = new Date('2026-03-24T00:00:00.000Z')
    const target = new Date('2026-03-29T00:00:00.000Z')
    expect(calculateCountdown(target, now)).toBe(5)
  })

  it('builds reminder candidates including the event day', () => {
    const now = new Date('2026-03-24T00:00:00.000Z')
    const candidates = getReminderCandidates(new Date('2026-04-10T00:00:00.000Z'), [7, 1], now)
    expect(candidates).toHaveLength(3)
    expect(candidates.map((item) => item.days)).toEqual([0, 7, 1])
  })
})
