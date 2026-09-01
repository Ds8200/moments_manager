import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useOrderDetailItems } from '../useOrderDetailItems'
import type { OrderItem } from '../../../../types'

const ITEM_1: OrderItem = {
  id: 'i1', product_id: 'p1', product_name: 'עוגה', quantity: 2,
  unit_price: '50', unit_cost: '20', total_price: '100', profit: '60', design_notes: null,
}
const ITEM_2: OrderItem = {
  id: 'i2', product_id: 'p2', product_name: 'עוגייה', quantity: 1,
  unit_price: '10', unit_cost: '4', total_price: '10', profit: '6', design_notes: 'בלי אגוזים',
}

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useOrderDetailItems', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    server.use(http.get(API_ENDPOINTS.PRODUCTS, () => HttpResponse.json({ items: [], total: 0, page: 1, page_size: 20, pages: 1 })))
  })

  it('onSaveQuantity PUTs the full items array with the one quantity changed', async () => {
    server.use(http.put(API_ENDPOINTS.ORDER(':id'), async ({ request }) => {
      const body = await request.json() as { items: Array<{ product_name: string; quantity: number }> }
      expect(body.items).toHaveLength(2)
      expect(body.items.find((i) => i.product_name === 'עוגה')?.quantity).toBe(5)
      expect(body.items.find((i) => i.product_name === 'עוגייה')?.quantity).toBe(1)
      return HttpResponse.json({})
    }))
    const { result } = renderHook(
      () => useOrderDetailItems({ orderId: 'o1', items: [ITEM_1, ITEM_2] }),
      { wrapper: makeWrapper(qc) }
    )

    await act(async () => { result.current.onSaveQuantity('i1', '5') })
  })

  it('onSaveQuantity falls back to 1 for an invalid number', async () => {
    server.use(http.put(API_ENDPOINTS.ORDER(':id'), async ({ request }) => {
      const body = await request.json() as { items: Array<{ quantity: number }> }
      expect(body.items[0].quantity).toBe(1)
      return HttpResponse.json({})
    }))
    const { result } = renderHook(
      () => useOrderDetailItems({ orderId: 'o1', items: [ITEM_1] }),
      { wrapper: makeWrapper(qc) }
    )

    await act(async () => { result.current.onSaveQuantity('i1', 'abc') })
  })

  it('onRemoveItem PUTs the items array without the removed item', async () => {
    server.use(http.put(API_ENDPOINTS.ORDER(':id'), async ({ request }) => {
      const body = await request.json() as { items: Array<{ product_name: string }> }
      expect(body.items).toHaveLength(1)
      expect(body.items[0].product_name).toBe('עוגייה')
      return HttpResponse.json({})
    }))
    const { result } = renderHook(
      () => useOrderDetailItems({ orderId: 'o1', items: [ITEM_1, ITEM_2] }),
      { wrapper: makeWrapper(qc) }
    )

    await act(async () => { result.current.onRemoveItem('i1') })
  })

  it('onStartAddItem opens the draft row', () => {
    const { result } = renderHook(
      () => useOrderDetailItems({ orderId: 'o1', items: [ITEM_1] }),
      { wrapper: makeWrapper(qc) }
    )
    expect(result.current.isDraftOpen).toBe(false)

    act(() => { result.current.onStartAddItem() })

    expect(result.current.isDraftOpen).toBe(true)
  })

  it('onDraftProductSelect appends the chosen product and closes the draft', async () => {
    server.use(http.put(API_ENDPOINTS.ORDER(':id'), async ({ request }) => {
      const body = await request.json() as { items: Array<{ product_name: string; unit_price: string }> }
      expect(body.items).toHaveLength(2)
      expect(body.items[1]).toMatchObject({ product_name: 'מגנט', unit_price: '15' })
      return HttpResponse.json({})
    }))
    const { result } = renderHook(
      () => useOrderDetailItems({ orderId: 'o1', items: [ITEM_1] }),
      { wrapper: makeWrapper(qc) }
    )
    act(() => { result.current.onStartAddItem() })

    await act(async () => {
      result.current.onDraftProductSelect('p3', {
        value: 'p3',
        label: 'מגנט',
        data: { id: 'p3', name: 'מגנט', category_id: null, category: null, base_price: '15', base_cost: '5', avg_production_days: 1, is_active: true, created_at: '', updated_at: '' },
      })
    })

    expect(result.current.isDraftOpen).toBe(false)
  })

  it('onDraftProductSelect does nothing when no option is chosen (free-text blur)', async () => {
    const { result } = renderHook(
      () => useOrderDetailItems({ orderId: 'o1', items: [ITEM_1] }),
      { wrapper: makeWrapper(qc) }
    )
    act(() => { result.current.onStartAddItem() })

    act(() => { result.current.onDraftProductSelect(null, null) })

    expect(result.current.isDraftOpen).toBe(true)
  })
})
