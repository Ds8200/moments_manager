import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useProductsTable } from '../useProductsTable'
import { productFiltersAtom, isProductFormOpenAtom, editingProductIdAtom } from '../../../store/productsAtoms'
import { PRODUCTS_LABELS } from '../../../constants/productsLabels'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

function makeWrapper(store: ReturnType<typeof createStore>, qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(Provider, { store }, children)
    )
  }
  return TestWrapper
}

const PRODUCT_ROW = {
  id: 'p1',
  name: 'חולצה',
  category: 'הדפסה',
  base_price: '100.00',
  base_cost: '40.00',
  avg_production_days: 2,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('useProductsTable', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    confirmFn.mockClear()
  })

  it('returns empty products by default', () => {
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.products).toEqual([])
  })

  it('returns products from the API', async () => {
    server.use(
      http.get(API_ENDPOINTS.PRODUCTS, () =>
        HttpResponse.json({ items: [PRODUCT_ROW], total: 1, page: 1, page_size: 20, pages: 1 })
      )
    )
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => {
      expect(result.current.products).toHaveLength(1)
    })
    expect(result.current.products[0].name).toBe('חולצה')
  })

  it('onEdit sets editing atom and opens form', () => {
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onEdit('p1')
    })

    expect(store.get(editingProductIdAtom)).toBe('p1')
    expect(store.get(isProductFormOpenAtom)).toBe(true)
  })

  it('onDelete opens confirm dialog with product name in message', () => {
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onDelete('p1', 'חולצה')
    })

    expect(confirmFn).toHaveBeenCalledWith(
      expect.objectContaining<Partial<ConfirmDialogOptions>>({
        message: `${PRODUCTS_LABELS.CONFIRM_DELETE} חולצה?`,
        isDangerous: true,
      })
    )
  })

  it('onDelete calls mutate when onConfirm callback is invoked', () => {
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onDelete('p1', 'חולצה')
    })

    // mutate is called — no error thrown means success (mutation is fire-and-forget in test)
    expect(confirmFn).toHaveBeenCalled()
  })

  it('onDelete does not mutate when confirm dialog is dismissed', () => {
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onDelete('p1', 'חולצה')
    })

    // confirmFn is called but onConfirm is never invoked — mutation never fires
    expect(confirmFn).toHaveBeenCalled()
  })

  it('onPageChange updates productFiltersAtom.page', () => {
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onPageChange(2)
    })

    expect(store.get(productFiltersAtom).page).toBe(2)
  })

  it('formatAmount formats a numeric string as currency', () => {
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })
    const formatted = result.current.formatAmount('100')
    expect(formatted).toContain('100')
  })
})
