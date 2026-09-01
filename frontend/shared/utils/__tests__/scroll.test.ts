import { describe, it, expect } from 'vitest'
import { getRtlStartScrollLeft } from '../scroll'

describe('getRtlStartScrollLeft', () => {
  it('returns the overflow amount when content is wider than the box', () => {
    expect(getRtlStartScrollLeft(2000, 500)).toBe(1500)
  })

  it('returns 0 when content is narrower than the box', () => {
    expect(getRtlStartScrollLeft(400, 500)).toBe(0)
  })

  it('returns 0 when content exactly fits the box', () => {
    expect(getRtlStartScrollLeft(500, 500)).toBe(0)
  })

  it('returns 0 when there is no layout (jsdom reports 0/0)', () => {
    expect(getRtlStartScrollLeft(0, 0)).toBe(0)
  })
})
