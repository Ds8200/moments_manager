import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { useOrderDetail } from '../useOrderDetail'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'

vi.mock('../../../queries/useOrder', () => ({
  useOrder: (id: string | null) => ({
    data: id ? { id, order_number: '1' } : undefined,
    isLoading: false,
  }),
}))

vi.mock('../../../queries/useOrders', () => ({
  useUpdateOrderStatus: () => ({ mutate: vi.fn() }),
  useUpdateOrderPayment: () => ({ mutate: vi.fn() }),
}))

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client }, children)
}

describe('useOrderDetail', () => {
  it('isOpen is false initially', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper })
    expect(result.current.isOpen).toBe(false)
    expect(result.current.order).toBeUndefined()
  })

  it('exposes statusOptions for every known status', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper })
    expect(result.current.statusOptions.length).toBeGreaterThan(0)
    result.current.statusOptions.forEach((opt) => {
      expect(typeof opt.value).toBe('string')
      expect(typeof opt.label).toBe('string')
    })
  })

  it('getUrgencyLabel returns mapped label for known urgency', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper })
    expect(result.current.getUrgencyLabel('critical')).toBe(ORDERS_LABELS.URGENCY_CRITICAL)
    expect(result.current.getUrgencyLabel('low')).toBe(ORDERS_LABELS.URGENCY_LOW)
  })

  it('getUrgencyLabel returns URGENCY_NONE when urgency is null', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper })
    expect(result.current.getUrgencyLabel(null)).toBe(ORDERS_LABELS.URGENCY_NONE)
  })

  it('formatDueDateTime returns URGENCY_NONE for null value', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper })
    expect(result.current.formatDueDateTime(null)).toBe(ORDERS_LABELS.URGENCY_NONE)
  })

  it('formatDueDateTime returns URGENCY_NONE for invalid date string', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper })
    expect(result.current.formatDueDateTime('not-a-date')).toBe(ORDERS_LABELS.URGENCY_NONE)
  })

  it('formatDueDateTime formats a valid ISO string into a non-empty string', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper })
    const formatted = result.current.formatDueDateTime('2025-03-15T10:30:00Z')
    expect(formatted).not.toBe(ORDERS_LABELS.URGENCY_NONE)
    expect(formatted.length).toBeGreaterThan(0)
  })

  it('onClose toggles isOpen back to false even when selectedId was null', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper })
    act(() => {
      result.current.onClose()
    })
    expect(result.current.isOpen).toBe(false)
  })
})
