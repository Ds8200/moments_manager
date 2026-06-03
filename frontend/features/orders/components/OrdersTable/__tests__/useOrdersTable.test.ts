import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { useOrdersTable } from '../useOrdersTable'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'
import { PAYMENT_STATE_LABELS } from '@/shared/enums/statusEnums'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const deleteMutate = vi.fn()
const statusMutate = vi.fn()
const confirmFn = vi.fn()

vi.mock('../../../queries/useOrders', () => ({
  useOrders: () => ({
    data: { items: [], total: 0, page: 1, page_size: 20, pages: 1 },
    isLoading: false,
    isError: false,
  }),
  useDeleteOrder: () => ({ mutate: deleteMutate }),
  useUpdateOrderStatus: () => ({ mutate: statusMutate }),
}))

vi.mock('@/shared/hooks/useConfirm', () => ({
  useConfirm: () => confirmFn,
}))

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client }, children)
}

const MOCK_ORDER = {
  id: 'order-1',
  order_number: 42,
  customer_name: 'דניאל',
  created_at: '2025-01-01T00:00:00Z',
  due_datetime: null,
  urgency: 'normal' as const,
  total_amount: '100.00',
  status: 'new' as const,
  is_paid: false,
  payment_method: null,
}

function makeMockEvent() {
  const el = document.createElement('tr')
  return { currentTarget: el } as unknown as React.MouseEvent<Element>
}

describe('useOrdersTable', () => {
  beforeEach(() => {
    deleteMutate.mockClear()
    statusMutate.mockClear()
    confirmFn.mockClear()
  })

  it('exposes orders from query data', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.orders).toEqual([])
    expect(result.current.total).toBe(0)
    expect(result.current.currentPage).toBe(1)
  })

  it('onRowMenuClick opens menu with order number as title', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.menuState.isOpen).toBe(false)

    act(() => {
      result.current.onRowMenuClick(MOCK_ORDER, makeMockEvent())
    })

    expect(result.current.menuState.isOpen).toBe(true)
    expect(result.current.menuState.title).toBe('#42')
  })

  it('delete menu item opens confirm dialog with correct message', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })

    act(() => {
      result.current.onRowMenuClick(MOCK_ORDER, makeMockEvent())
    })

    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => { deleteItem!.onClick() })

    expect(confirmFn).toHaveBeenCalledWith(
      expect.objectContaining<Partial<ConfirmDialogOptions>>({
        message: ORDERS_LABELS.CONFIRM_DELETE,
        isDangerous: true,
      })
    )
  })

  it('delete menu item calls mutate when onConfirm callback is invoked', () => {
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useOrdersTable(), { wrapper })

    act(() => {
      result.current.onRowMenuClick(MOCK_ORDER, makeMockEvent())
    })
    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => { deleteItem!.onClick() })

    expect(deleteMutate).toHaveBeenCalledWith('order-1')
  })

  it('delete menu item does not call mutate when confirm is dismissed', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })

    act(() => {
      result.current.onRowMenuClick(MOCK_ORDER, makeMockEvent())
    })
    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => { deleteItem!.onClick() })

    expect(deleteMutate).not.toHaveBeenCalled()
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

  it('getUrgencyClass returns urgencyNormal for normal urgency', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.getUrgencyClass('normal')).toBe('urgencyNormal')
  })

  it('getUrgencyClass returns urgencyVeryUrgent for very_urgent urgency', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.getUrgencyClass('very_urgent')).toBe('urgencyVeryUrgent')
  })

  it('formatDueDateTime returns URGENCY_NONE for null', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.formatDueDateTime(null)).toBe(ORDERS_LABELS.URGENCY_NONE)
  })
})
