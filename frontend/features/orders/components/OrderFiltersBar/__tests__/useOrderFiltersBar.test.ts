import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useOrderFiltersBar } from '../useOrderFiltersBar'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'
import { PAYMENT_STATE_LABELS } from '@/shared/enums/statusEnums'

describe('useOrderFiltersBar', () => {
  it('exposes default filters and statusSelect options with all-statuses first', () => {
    const { result } = renderHook(() => useOrderFiltersBar())

    expect(result.current.filters.search).toBe('')
    expect(result.current.filters.status).toBe('')
    expect(result.current.statusSelect.options[0]).toEqual({
      value: '',
      label: ORDERS_LABELS.ALL_STATUSES,
    })
    expect(result.current.statusSelect.options.length).toBeGreaterThan(1)
  })

  it('exposes paymentSelect options with all-payment first, then the 3 payment states', () => {
    const { result } = renderHook(() => useOrderFiltersBar())

    expect(result.current.paymentSelect.options[0]).toEqual({
      value: '',
      label: ORDERS_LABELS.ALL_PAYMENT,
    })
    expect(result.current.paymentSelect.options[1]).toEqual({
      value: 'unpaid',
      label: PAYMENT_STATE_LABELS.unpaid,
    })
    expect(result.current.paymentSelect.options.length).toBe(4)
  })

  it('onSearchChange updates filters.search and resets page', () => {
    const { result } = renderHook(() => useOrderFiltersBar())

    act(() => {
      result.current.onSearchChange('acme')
    })

    expect(result.current.filters.search).toBe('acme')
    expect(result.current.filters.page).toBe(1)
  })

  it('statusSelect.onChange updates filters.status', () => {
    const { result } = renderHook(() => useOrderFiltersBar())

    act(() => {
      result.current.statusSelect.onChange('new')
    })

    expect(result.current.filters.status).toBe('new')
  })

  it('paymentSelect.onChange updates filters.payment_state', () => {
    const { result } = renderHook(() => useOrderFiltersBar())

    act(() => {
      result.current.paymentSelect.onChange('transfer')
    })

    expect(result.current.filters.payment_state).toBe('transfer')
  })

  it('onDateFromChange and onDateToChange update date filters', () => {
    const { result } = renderHook(() => useOrderFiltersBar())

    act(() => {
      result.current.onDateFromChange('2025-01-01')
      result.current.onDateToChange('2025-12-31')
    })

    expect(result.current.filters.date_from).toBe('2025-01-01')
    expect(result.current.filters.date_to).toBe('2025-12-31')
  })

  it('changing any filter resets page back to 1', () => {
    const { result } = renderHook(() => useOrderFiltersBar())

    act(() => {
      result.current.onSearchChange('a')
    })

    expect(result.current.filters.page).toBe(1)
  })
})
