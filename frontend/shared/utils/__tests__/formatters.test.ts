import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatShortDate } from '../formatters'

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats whole amounts as ILS without a decimal part', () => {
      const result = formatCurrency(1234)
      expect(result).toContain('1,234')
      expect(result).not.toMatch(/\.\d/)
    })

    it('keeps one decimal digit instead of rounding to a whole shekel', () => {
      expect(formatCurrency('5.5')).toContain('5.5')
      expect(formatCurrency(1234.6)).toContain('1,234.6')
    })

    it('parses string amounts before formatting', () => {
      const result = formatCurrency('500')
      expect(result).toContain('500')
    })

    it('handles zero correctly', () => {
      const result = formatCurrency(0)
      expect(result).toContain('0')
    })
  })

  describe('formatDate', () => {
    it('formats an ISO date string into a he-IL date', () => {
      const result = formatDate('2025-03-15')
      expect(result).toContain('15')
      expect(result).toContain('3')
      expect(result).toContain('2025')
    })

    it('accepts a Date object directly', () => {
      const result = formatDate(new Date('2025-12-31'))
      expect(result).toContain('31')
      expect(result).toContain('2025')
    })
  })

  describe('formatShortDate', () => {
    it('formats date without year', () => {
      const result = formatShortDate('2025-03-15')
      expect(result).toContain('15')
      expect(result).toContain('3')
      expect(result).not.toContain('2025')
    })
  })
})
