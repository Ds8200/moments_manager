import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useProductsTable } from '../useProductsTable'
import { productFiltersAtom } from '../../../store/productsAtoms'
import { PRODUCTS_LABELS } from '../../../constants/productsLabels'
import { PRODUCT_DETAIL_ROUTE } from '@/shared/constants/routes'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

const pushFn = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushFn }) }))

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
  category: null,
  category_id: null,
  base_price: '100.00',
  base_cost: '40.00',
  avg_production_days: 2,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

function makeContextMenuEvent() {
  return { preventDefault: vi.fn(), currentTarget: document.createElement('tr') }
}

describe('useProductsTable', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    confirmFn.mockClear()
    pushFn.mockClear()
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

  it('row onClick navigates to the product detail page', () => {
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })

    act(() => { result.current.getRowProps(PRODUCT_ROW).onClick() })

    expect(pushFn).toHaveBeenCalledWith(PRODUCT_DETAIL_ROUTE('p1'))
  })

  it('right-click opens menu with product name as title', () => {
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })
    const rowProps = result.current.getRowProps(PRODUCT_ROW)
    const event = makeContextMenuEvent()

    act(() => { rowProps.onContextMenu(event as unknown as Parameters<typeof rowProps.onContextMenu>[0]) })

    expect(result.current.menuState.isOpen).toBe(true)
    expect(result.current.menuState.title).toBe('חולצה')
  })

  it('menu has no edit item — editing happens on the detail page now', () => {
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })
    const rowProps = result.current.getRowProps(PRODUCT_ROW)
    const event = makeContextMenuEvent()
    act(() => { rowProps.onContextMenu(event as unknown as Parameters<typeof rowProps.onContextMenu>[0]) })

    const editItem = result.current.menuState.items.find((i) => i.label === PRODUCTS_LABELS.TABLE_EDIT_TITLE)
    expect(editItem).toBeUndefined()
    expect(result.current.menuState.items).toHaveLength(1)
  })

  it('delete menu item opens confirm dialog with product name', () => {
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })
    const rowProps = result.current.getRowProps(PRODUCT_ROW)
    const event = makeContextMenuEvent()
    act(() => { rowProps.onContextMenu(event as unknown as Parameters<typeof rowProps.onContextMenu>[0]) })

    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => { deleteItem!.onClick() })

    expect(confirmFn).toHaveBeenCalledWith(
      expect.objectContaining<Partial<ConfirmDialogOptions>>({
        message: `${PRODUCTS_LABELS.CONFIRM_DELETE} חולצה?`,
        isDangerous: true,
      })
    )
  })

  it('delete menu item calls onConfirm when confirmed', () => {
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useProductsTable(), { wrapper: makeWrapper(store, qc) })
    const rowProps = result.current.getRowProps(PRODUCT_ROW)
    const event = makeContextMenuEvent()
    act(() => { rowProps.onContextMenu(event as unknown as Parameters<typeof rowProps.onContextMenu>[0]) })

    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => { deleteItem!.onClick() })

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
