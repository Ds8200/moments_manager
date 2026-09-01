import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ROUTES } from '@/shared/constants/routes'
import { useOrderDetailPage } from '../useOrderDetailPage'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

const pushFn = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushFn }) }))

const ORDER = {
  id: 'o1', order_number: 'ORD-0001', customer_id: 'c1', customer_name: 'דניאל',
  date: '2025-01-01', due_datetime: null, urgency: 'normal', status: 'new',
  is_paid: false, payment_method: null, total_amount: '100', total_cost: '40', total_profit: '60',
  notes: 'הערה', items: [], files: [],
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useOrderDetailPage', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    confirmFn.mockClear()
    pushFn.mockClear()
    server.use(http.get(API_ENDPOINTS.ORDER(':id'), () => HttpResponse.json(ORDER)))
  })

  it('loads the order and formats amounts as currency', async () => {
    const { result } = renderHook(() => useOrderDetailPage({ orderId: 'o1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.order).toBeDefined())

    expect(result.current.menuTitle).toBe('ORD-0001')
    expect(result.current.formattedTotal).toContain('100')
  })

  it('menu has a single Delete item — Edit is gone', async () => {
    const { result } = renderHook(() => useOrderDetailPage({ orderId: 'o1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.order).toBeDefined())

    expect(result.current.menuItems).toHaveLength(1)
    expect(result.current.menuItems[0].variant).toBe('danger')
  })

  it('delete menu item opens a confirm dialog and navigates to the list on success', async () => {
    server.use(http.delete(API_ENDPOINTS.ORDER(':id'), () => new HttpResponse(null, { status: 204 })))
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useOrderDetailPage({ orderId: 'o1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.order).toBeDefined())

    const deleteItem = result.current.menuItems.find((i) => i.variant === 'danger')
    await act(async () => { deleteItem!.onClick() })

    await vi.waitFor(() => expect(pushFn).toHaveBeenCalledWith(ROUTES.ORDERS))
  })

  it('onSaveNotes does not throw when saving a changed value', async () => {
    server.use(http.put(API_ENDPOINTS.ORDER(':id'), () => HttpResponse.json({ ...ORDER, notes: 'חדש' })))
    const { result } = renderHook(() => useOrderDetailPage({ orderId: 'o1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.order).toBeDefined())

    await expect(act(async () => { result.current.onSaveNotes('חדש') })).resolves.not.toThrow()
  })

  it('getFileDownloadUrl builds the file endpoint for this order', async () => {
    const { result } = renderHook(() => useOrderDetailPage({ orderId: 'o1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.order).toBeDefined())

    expect(result.current.getFileDownloadUrl('f1')).toBe(API_ENDPOINTS.ORDER_FILE('o1', 'f1'))
  })
})
