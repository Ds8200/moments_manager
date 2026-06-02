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
  useUpdateOrderUrgency: () => ({ mutate: vi.fn() }),
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

  it('exposes 3 urgencyOptions matching the 3 urgency levels', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper })
    expect(result.current.urgencyOptions).toHaveLength(3)
    const values = result.current.urgencyOptions.map((o) => o.value)
    expect(values).toContain('normal')
    expect(values).toContain('urgent')
    expect(values).toContain('very_urgent')
  })

  it('urgencyOptions labels match ORDERS_LABELS', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper })
    const normal = result.current.urgencyOptions.find((o) => o.value === 'normal')
    const urgent = result.current.urgencyOptions.find((o) => o.value === 'urgent')
    const veryUrgent = result.current.urgencyOptions.find((o) => o.value === 'very_urgent')
    expect(normal?.label).toBe(ORDERS_LABELS.URGENCY_NORMAL)
    expect(urgent?.label).toBe(ORDERS_LABELS.URGENCY_URGENT)
    expect(veryUrgent?.label).toBe(ORDERS_LABELS.URGENCY_VERY_URGENT)
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
