import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useFiltersBar } from '../useFiltersBar'
import type { FiltersBarProps } from '../useFiltersBar'

const buildProps = (overrides: Partial<FiltersBarProps> = {}): FiltersBarProps => ({
  searchValue: '',
  searchPlaceholder: 'חיפוש...',
  onSearchChange: vi.fn(),
  ...overrides,
})

describe('useFiltersBar', () => {
  it('passes through searchValue and searchPlaceholder', () => {
    const { result } = renderHook(() => useFiltersBar(buildProps({ searchValue: 'test' })))
    expect(result.current.searchValue).toBe('test')
    expect(result.current.searchPlaceholder).toBe('חיפוש...')
  })

  it('defaults selects to empty array when not provided', () => {
    const { result } = renderHook(() => useFiltersBar(buildProps()))
    expect(result.current.selects).toEqual([])
  })

  it('passes through selects array when provided', () => {
    const selects = [{ value: '', options: [{ value: '', label: 'הכל' }], onChange: vi.fn() }]
    const { result } = renderHook(() => useFiltersBar(buildProps({ selects })))
    expect(result.current.selects).toHaveLength(1)
  })

  it('showDates=false when no date callbacks', () => {
    const { result } = renderHook(() => useFiltersBar(buildProps()))
    expect(result.current.showDates).toBe(false)
  })

  it('showDates=true when onDateFromChange provided', () => {
    const { result } = renderHook(() => useFiltersBar(buildProps({ onDateFromChange: vi.fn() })))
    expect(result.current.showDates).toBe(true)
  })

  it('showDates=true when onDateToChange provided', () => {
    const { result } = renderHook(() => useFiltersBar(buildProps({ onDateToChange: vi.fn() })))
    expect(result.current.showDates).toBe(true)
  })

  it('defaults dateFrom and dateTo to empty string', () => {
    const { result } = renderHook(() => useFiltersBar(buildProps()))
    expect(result.current.dateFrom).toBe('')
    expect(result.current.dateTo).toBe('')
  })

  it('passes through dateFrom and dateTo when provided', () => {
    const { result } = renderHook(() =>
      useFiltersBar(buildProps({ dateFrom: '2025-01-01', dateTo: '2025-12-31' }))
    )
    expect(result.current.dateFrom).toBe('2025-01-01')
    expect(result.current.dateTo).toBe('2025-12-31')
  })
})
