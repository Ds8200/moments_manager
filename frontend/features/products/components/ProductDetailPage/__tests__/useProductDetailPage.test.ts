import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ROUTES } from '@/shared/constants/routes'
import { useProductDetailPage } from '../useProductDetailPage'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

const pushFn = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushFn }) }))

const PRODUCT = {
  id: 'p1', name: 'חולצה', category_id: null, category: null,
  base_price: '100.00', base_cost: '40.00', avg_production_days: 2, is_active: true,
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useProductDetailPage', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    confirmFn.mockClear()
    pushFn.mockClear()
    server.use(
      http.get(API_ENDPOINTS.PRODUCT(':id'), () => HttpResponse.json(PRODUCT)),
      http.get(API_ENDPOINTS.PRODUCT_CATEGORIES, () => HttpResponse.json([])),
    )
  })

  it('loads the product', async () => {
    const { result } = renderHook(() => useProductDetailPage({ productId: 'p1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.product).toBeDefined())

    expect(result.current.product?.name).toBe('חולצה')
    expect(result.current.currentStatus).toBe('true')
  })

  it('statusOptions has active and inactive choices', async () => {
    const { result } = renderHook(() => useProductDetailPage({ productId: 'p1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.product).toBeDefined())

    expect(result.current.statusOptions).toHaveLength(2)
  })

  it('categoryOptions always includes the "no category" placeholder first', async () => {
    const { result } = renderHook(() => useProductDetailPage({ productId: 'p1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.product).toBeDefined())

    expect(result.current.categoryOptions[0].value).toBe('')
  })

  it('delete menu item opens a confirm dialog and navigates on success', async () => {
    server.use(http.delete(API_ENDPOINTS.PRODUCT(':id'), () => new HttpResponse(null, { status: 204 })))
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useProductDetailPage({ productId: 'p1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.product).toBeDefined())

    const deleteItem = result.current.menuItems.find((i) => i.variant === 'danger')
    await act(async () => { deleteItem!.onClick() })

    await vi.waitFor(() => expect(pushFn).toHaveBeenCalledWith(ROUTES.PRODUCTS))
  })

  it('onSaveProdDays does not throw when saving a numeric value', async () => {
    server.use(http.put(API_ENDPOINTS.PRODUCT(':id'), () => HttpResponse.json({ ...PRODUCT, avg_production_days: 5 })))
    const { result } = renderHook(() => useProductDetailPage({ productId: 'p1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.product).toBeDefined())

    await expect(act(async () => { result.current.onSaveProdDays('5') })).resolves.not.toThrow()
  })
})
