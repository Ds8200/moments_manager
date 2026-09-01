import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { useOrdersTable } from '../useOrdersTable'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'
import { ORDER_DETAIL_ROUTE } from '@/shared/constants/routes'
import { PAYMENT_STATE_LABELS } from '@/shared/enums/statusEnums'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const deleteMutate = vi.fn()
const statusMutate = vi.fn()
const confirmFn = vi.fn()
const pushFn = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushFn }),
}))

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
  items: [{ id: 'item-1', product_name: 'עוגה', quantity: 2 }],
}

function makeMockButtonEvent() {
  const stopPropagation = vi.fn()
  return { stopPropagation } as unknown as React.MouseEvent<Element> & {
    stopPropagation: ReturnType<typeof vi.fn>
  }
}

function makeContextMenuEvent() {
  return { preventDefault: vi.fn(), currentTarget: document.createElement('tr') }
}

describe('useOrdersTable', () => {
  beforeEach(() => {
    deleteMutate.mockClear()
    statusMutate.mockClear()
    confirmFn.mockClear()
    pushFn.mockClear()
  })

  it('exposes orders from query data', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.orders).toEqual([])
    expect(result.current.total).toBe(0)
    expect(result.current.currentPage).toBe(1)
  })

  it('row onClick navigates to the order detail page', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })

    act(() => { result.current.getRowProps(MOCK_ORDER).onClick() })

    expect(pushFn).toHaveBeenCalledWith(ORDER_DETAIL_ROUTE('order-1'))
  })

  it('right-click opens menu with order number as title', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.menuState.isOpen).toBe(false)
    const rowProps = result.current.getRowProps(MOCK_ORDER)
    const event = makeContextMenuEvent()

    act(() => { rowProps.onContextMenu(event as unknown as Parameters<typeof rowProps.onContextMenu>[0]) })

    expect(result.current.menuState.isOpen).toBe(true)
    expect(result.current.menuState.title).toBe('#42')
  })

  it('menu has a single Delete item — View and Edit are gone', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    const rowProps = result.current.getRowProps(MOCK_ORDER)
    const event = makeContextMenuEvent()
    act(() => { rowProps.onContextMenu(event as unknown as Parameters<typeof rowProps.onContextMenu>[0]) })

    expect(result.current.menuState.items).toHaveLength(1)
    expect(result.current.menuState.items[0].variant).toBe('danger')
  })

  it('delete menu item opens confirm dialog with correct message', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    const rowProps = result.current.getRowProps(MOCK_ORDER)
    const event = makeContextMenuEvent()
    act(() => { rowProps.onContextMenu(event as unknown as Parameters<typeof rowProps.onContextMenu>[0]) })

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
    const rowProps = result.current.getRowProps(MOCK_ORDER)
    const event = makeContextMenuEvent()
    act(() => { rowProps.onContextMenu(event as unknown as Parameters<typeof rowProps.onContextMenu>[0]) })

    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => { deleteItem!.onClick() })

    expect(deleteMutate).toHaveBeenCalledWith('order-1')
  })

  it('delete menu item does not call mutate when confirm is dismissed', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    const rowProps = result.current.getRowProps(MOCK_ORDER)
    const event = makeContextMenuEvent()
    act(() => { rowProps.onContextMenu(event as unknown as Parameters<typeof rowProps.onContextMenu>[0]) })

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

  it('expandedOrderId is null by default', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    expect(result.current.expandedOrderId).toBeNull()
  })

  it('toggleExpanded sets expandedOrderId and stops propagation', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })
    const event = makeMockButtonEvent()

    act(() => {
      result.current.toggleExpanded('order-1', event)
    })

    expect(result.current.expandedOrderId).toBe('order-1')
    expect(event.stopPropagation).toHaveBeenCalled()
  })

  it('toggleExpanded collapses when the same order id is toggled again', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })

    act(() => {
      result.current.toggleExpanded('order-1', makeMockButtonEvent())
    })
    act(() => {
      result.current.toggleExpanded('order-1', makeMockButtonEvent())
    })

    expect(result.current.expandedOrderId).toBeNull()
  })

  it('toggleExpanded switches to a different order, closing the previous one (accordion)', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })

    act(() => {
      result.current.toggleExpanded('order-1', makeMockButtonEvent())
    })
    act(() => {
      result.current.toggleExpanded('order-2', makeMockButtonEvent())
    })

    expect(result.current.expandedOrderId).toBe('order-2')
  })

  it('onPageChange resets expandedOrderId to null', () => {
    const { result } = renderHook(() => useOrdersTable(), { wrapper })

    act(() => {
      result.current.toggleExpanded('order-1', makeMockButtonEvent())
    })
    expect(result.current.expandedOrderId).toBe('order-1')

    act(() => {
      result.current.onPageChange(2)
    })

    expect(result.current.expandedOrderId).toBeNull()
  })
})
