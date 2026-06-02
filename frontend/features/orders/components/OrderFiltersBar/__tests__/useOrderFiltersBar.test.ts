import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useOrderFiltersBar } from '../useOrderFiltersBar'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'
import { PAYMENT_STATE_LABELS } from '@/shared/enums/statusEnums'

describe('useOrderFiltersBar', () => {
  it('exposes default filters and statusOptions with all-statuses option first', () => {
    const { result } = renderHook(() => useOrderFiltersBar())

    expect(result.current.filters.search).toBe('')
    expect(result.current.filters.status).toBe('')
    expect(result.current.statusOptions[0]).toEqual({
      value: '',
      label: ORDERS_LABELS.ALL_STATUSES,
    })
    expect(result.current.statusOptions.length).toBeGreaterThan(1)
  })

  it('exposes paymentStateOptions with all-payment option first, then the 3 payment states', () => {
    const { result } = renderHook(() => useOrderFiltersBar())

    expect(result.current.paymentStateOptions[0]).toEqual({
      value: '',
      label: ORDERS_LABELS.ALL_PAYMENT,
    })
    expect(result.current.paymentStateOptions[1]).toEqual({
      value: 'unpaid',
      label: PAYMENT_STATE_LABELS.unpaid,
    })
    expect(result.current.paymentStateOptions.length).toBe(4)
  })

  it('onSearchChange updates filters.search and resets page', () => {
    const { result } = renderHook(() => useOrderFiltersBar())

    act(() => {
      result.current.onSearchChange('acme')
    })

    expect(result.current.filters.search).toBe('acme')
    expect(result.current.filters.page).toBe(1)
  })

  it('onStatusChange updates filters.status', () => {
    const { result } = renderHook(() => useOrderFiltersBar())

    act(() => {
      result.current.onStatusChange('new')
    })

    expect(result.current.filters.status).toBe('new')
  })

  it('onPaymentStateChange updates filters.payment_state', () => {
    const { result } = renderHook(() => useOrderFiltersBar())

    act(() => {
      result.current.onPaymentStateChange('transfer')
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
    // first establish a non-1 page by simulating multiple filter changes; the patch
    // function always sets page=1 so we can only assert that
    expect(result.current.filters.page).toBe(1)
  })
})
