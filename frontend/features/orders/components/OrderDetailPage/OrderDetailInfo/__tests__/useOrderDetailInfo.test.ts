import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useOrderDetailInfo } from '../useOrderDetailInfo'
import type { Order } from '../../../../types'

const ORDER: Order = {
  id: 'o1', order_number: 'ORD-0001', customer_id: 'c1', customer_name: 'דניאל',
  date: '2025-01-01', due_datetime: '2025-01-05T10:00:00Z', urgency: 'normal', status: 'new',
  is_paid: false, payment_method: null, total_amount: '100', total_cost: '40', total_profit: '60',
  notes: null, items: [], files: [],
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useOrderDetailInfo', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  it('rawDate is the ISO date, formattedDate is localized', () => {
    const { result } = renderHook(() => useOrderDetailInfo({ order: ORDER }), { wrapper: makeWrapper(qc) })
    expect(result.current.rawDate).toBe('2025-01-01')
    expect(result.current.formattedDate).not.toBe('2025-01-01')
  })

  it('rawDueDatetime is trimmed to minute precision for the datetime-local input', () => {
    const { result } = renderHook(() => useOrderDetailInfo({ order: ORDER }), { wrapper: makeWrapper(qc) })
    expect(result.current.rawDueDatetime).toBe('2025-01-05T10:00')
  })

  it('rawDueDatetime is empty when the order has no due date', () => {
    const { result } = renderHook(() => useOrderDetailInfo({ order: { ...ORDER, due_datetime: null } }), { wrapper: makeWrapper(qc) })
    expect(result.current.rawDueDatetime).toBe('')
  })

  it('currentPaymentState derives from is_paid/payment_method', () => {
    const { result } = renderHook(() => useOrderDetailInfo({ order: { ...ORDER, is_paid: true, payment_method: 'cash' } }), { wrapper: makeWrapper(qc) })
    expect(result.current.currentPaymentState).toBe('cash')
  })

  it('onSaveDate does not throw', async () => {
    server.use(http.put(API_ENDPOINTS.ORDER(':id'), () => HttpResponse.json({ ...ORDER, date: '2025-02-01' })))
    const { result } = renderHook(() => useOrderDetailInfo({ order: ORDER }), { wrapper: makeWrapper(qc) })

    await expect(act(async () => { result.current.onSaveDate('2025-02-01') })).resolves.not.toThrow()
  })

  it('onSaveDueDatetime sends null when cleared', async () => {
    server.use(http.put(API_ENDPOINTS.ORDER(':id'), async ({ request }) => {
      const body = await request.json() as { due_datetime: string | null }
      expect(body.due_datetime).toBeNull()
      return HttpResponse.json({ ...ORDER, due_datetime: null })
    }))
    const { result } = renderHook(() => useOrderDetailInfo({ order: ORDER }), { wrapper: makeWrapper(qc) })

    await act(async () => { result.current.onSaveDueDatetime('') })
  })

  it('onUrgencyChange does not throw', async () => {
    server.use(http.patch(API_ENDPOINTS.ORDER_URGENCY(':id'), () => HttpResponse.json({ ...ORDER, urgency: 'urgent' })))
    const { result } = renderHook(() => useOrderDetailInfo({ order: ORDER }), { wrapper: makeWrapper(qc) })

    await expect(act(async () => { result.current.onUrgencyChange('urgent') })).resolves.not.toThrow()
  })
})
