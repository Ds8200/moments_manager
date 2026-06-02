import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { useOrdersTable } from '../useOrdersTable'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'
import { PAYMENT_STATE_LABELS } from '@/shared/enums/statusEnums'

const deleteMutate = vi.fn()
const statusMutate = vi.fn()

vi.mock('../../../queries/useOrders', () => ({
  useOrders: () => ({
    data: { items: [], total: 0, page: 1, page_size: 20, pages: 1 },
    isLoading: false,
    isError: false,
  }),
  useDeleteOrder: () => ({ mutate: deleteMutate }),
  useUpdateOrderStatus: () => ({ mutate: statusMutate }),
}))

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client }, children)
}

describe('useOrdersTable', () => {
  beforeEach(() => {
    deleteMutate.mockClear()
    statusMutate.mockClear()
  })

  it('exposes orders from query data', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.orders).toEqual([])
    expect(result.current.total).toBe(0)
    expect(result.current.currentPage).toBe(1)
  })

  it('onDeleteOrder calls mutate when window.confirm returns true', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { result } = renderHook(() => useOrdersTable(), { wrapper })

    act(() => {
      result.current.onDeleteOrder('order-1')
    })

    expect(confirmSpy).toHaveBeenCalledWith(ORDERS_LABELS.CONFIRM_DELETE)
    expect(deleteMutate).toHaveBeenCalledWith('order-1')
    confirmSpy.mockRestore()
  })

  it('onDeleteOrder skips mutate when window.confirm returns false', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { result } = renderHook(() => useOrdersTable(), { wrapper })

    act(() => {
      result.current.onDeleteOrder('order-2')
    })

    expect(deleteMutate).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('onStatusChange calls mutate with id and status payload', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })

    act(() => {
      result.current.onStatusChange('order-1', 'ready')
    })

    expect(statusMutate).toHaveBeenCalledWith({
      id: 'order-1',
      payload: { status: 'ready' },
    })
  })

  it('getPaymentLabel returns "לא שולם" for unpaid order', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.getPaymentLabel(false, null)).toBe(PAYMENT_STATE_LABELS.unpaid)
  })

  it('getPaymentLabel returns "במזומן" when paid with cash', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.getPaymentLabel(true, 'cash')).toBe(PAYMENT_STATE_LABELS.cash)
  })

  it('getPaymentLabel returns "בהעברה" when paid via transfer', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.getPaymentLabel(true, 'transfer')).toBe(PAYMENT_STATE_LABELS.transfer)
  })

  it('getUrgencyClass returns empty string when urgency is null', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.getUrgencyClass(null)).toBe('')
  })

  it('formatDueDateTime returns URGENCY_NONE for null', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.formatDueDateTime(null)).toBe(ORDERS_LABELS.URGENCY_NONE)
  })
})
