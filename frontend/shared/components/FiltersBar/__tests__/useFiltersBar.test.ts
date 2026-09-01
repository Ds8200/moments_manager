import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useFiltersBar } from '../useFiltersBar'
import type { FiltersBarProps, FiltersBarSelectConfig } from '../useFiltersBar'
import { UI_LABELS } from '@/shared/constants/uiLabels'

const buildSelect = (overrides: Partial<FiltersBarSelectConfig> = {}): FiltersBarSelectConfig => ({
  value: '',
  options: [
    { value: '', label: 'הכל' },
    { value: 'open', label: 'פתוח' },
  ],
  onChange: vi.fn(),
  ...overrides,
})

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

  it('isExpanded defaults to false and toggleExpanded flips it', () => {
    const { result } = renderHook(() => useFiltersBar(buildProps({ selects: [buildSelect()] })))
    expect(result.current.isExpanded).toBe(false)

    act(() => result.current.toggleExpanded())
    expect(result.current.isExpanded).toBe(true)

    act(() => result.current.toggleExpanded())
    expect(result.current.isExpanded).toBe(false)
  })

  it('hasCollapsibleControls is false for a search-only bar', () => {
    const { result } = renderHook(() => useFiltersBar(buildProps()))
    expect(result.current.hasCollapsibleControls).toBe(false)
  })

  it('hasCollapsibleControls is true when selects are provided', () => {
    const { result } = renderHook(() => useFiltersBar(buildProps({ selects: [buildSelect()] })))
    expect(result.current.hasCollapsibleControls).toBe(true)
  })

  it('hasCollapsibleControls is true when a date handler is provided', () => {
    const { result } = renderHook(() =>
      useFiltersBar(buildProps({ onDateFromChange: vi.fn() }))
    )
    expect(result.current.hasCollapsibleControls).toBe(true)
  })

  it('activeCount is 0 when every select sits on its first option and no dates are set', () => {
    const { result } = renderHook(() =>
      useFiltersBar(buildProps({ selects: [buildSelect(), buildSelect()] }))
    )
    expect(result.current.activeCount).toBe(0)
  })

  it('activeCount counts a select whose value differs from its first option', () => {
    const { result } = renderHook(() =>
      useFiltersBar(buildProps({ selects: [buildSelect({ value: 'open' }), buildSelect()] }))
    )
    expect(result.current.activeCount).toBe(1)
  })

  it('activeCount adds one for each non-empty date bound', () => {
    const { result } = renderHook(() =>
      useFiltersBar(
        buildProps({
          selects: [buildSelect({ value: 'open' })],
          dateFrom: '2025-01-01',
          dateTo: '2025-12-31',
          onDateFromChange: vi.fn(),
        })
      )
    )
    expect(result.current.activeCount).toBe(3)
  })

  it('exposes the shared filters toggle label', () => {
    const { result } = renderHook(() => useFiltersBar(buildProps()))
    expect(result.current.filtersToggleLabel).toBe(UI_LABELS.FILTERS_TOGGLE)
  })
})
