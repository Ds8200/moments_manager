import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ordersApi } from '../api'
import type { OrderFilters } from '../types'

const ORDER = {
  id: 'o1', order_number: 'ORD-0001', customer_id: 'c1', customer_name: 'דניאל',
  date: '2025-01-01', due_datetime: null, urgency: 'normal', status: 'new',
  is_paid: false, payment_method: null, total_amount: '100', total_cost: '40', total_profit: '60',
  notes: null, items: [], files: [],
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

const EMPTY_FILTERS: Partial<OrderFilters> = {}

describe('ordersApi', () => {
  it('get fetches a single order', async () => {
    server.use(http.get(API_ENDPOINTS.ORDER(':id'), () => HttpResponse.json(ORDER)))
    const result = await ordersApi.get('o1')
    expect(result.id).toBe('o1')
  })

  it('create POSTs the payload', async () => {
    server.use(http.post(API_ENDPOINTS.ORDERS, () => HttpResponse.json(ORDER, { status: 201 })))
    const result = await ordersApi.create({
      customer_id: 'c1', date: '2025-01-01', due_datetime: null, notes: '', items: [],
    })
    expect(result.id).toBe('o1')
  })

  it('update PUTs a partial payload', async () => {
    server.use(http.put(API_ENDPOINTS.ORDER(':id'), () => HttpResponse.json({ ...ORDER, notes: 'x' })))
    const result = await ordersApi.update('o1', { notes: 'x' })
    expect(result.notes).toBe('x')
  })

  it('delete sends a DELETE request', async () => {
    server.use(http.delete(API_ENDPOINTS.ORDER(':id'), () => new HttpResponse(null, { status: 204 })))
    await expect(ordersApi.delete('o1')).resolves.toBeUndefined()
  })

  it('updateStatus PATCHes the status endpoint', async () => {
    server.use(http.patch(API_ENDPOINTS.ORDER_STATUS(':id'), () => HttpResponse.json({ ...ORDER, status: 'ready' })))
    const result = await ordersApi.updateStatus('o1', { status: 'ready' })
    expect(result.status).toBe('ready')
  })

  it('updatePayment PATCHes the payment endpoint', async () => {
    server.use(http.patch(API_ENDPOINTS.ORDER_PAYMENT(':id'), () => HttpResponse.json({ ...ORDER, is_paid: true })))
    const result = await ordersApi.updatePayment('o1', { is_paid: true, payment_method: 'cash' })
    expect(result.is_paid).toBe(true)
  })

  it('updateUrgency PATCHes the urgency endpoint', async () => {
    server.use(http.patch(API_ENDPOINTS.ORDER_URGENCY(':id'), () => HttpResponse.json({ ...ORDER, urgency: 'urgent' })))
    const result = await ordersApi.updateUrgency('o1', { urgency: 'urgent' })
    expect(result.urgency).toBe('urgent')
  })

  it('uploadFile POSTs form data to the files endpoint', async () => {
    server.use(http.post(API_ENDPOINTS.ORDER_FILES(':id'), () => HttpResponse.json(ORDER)))
    const file = new File(['content'], 'design.png', { type: 'image/png' })
    const result = await ordersApi.uploadFile('o1', file)
    expect(result.id).toBe('o1')
  })

  it('deleteFile sends a DELETE request to the file endpoint', async () => {
    server.use(http.delete(API_ENDPOINTS.ORDER_FILE(':orderId', ':fileId'), () => new HttpResponse(null, { status: 204 })))
    await expect(ordersApi.deleteFile('o1', 'f1')).resolves.toBeUndefined()
  })

  describe('list filter branches', () => {
    it('sends no query params for empty filters', async () => {
      server.use(http.get(API_ENDPOINTS.ORDERS, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('search')).toBeNull()
        expect(url.searchParams.get('page')).toBe('1')
        expect(url.searchParams.get('page_size')).toBe('20')
        return HttpResponse.json({ items: [], total: 0, page: 1, page_size: 20, pages: 0 })
      }))
      await ordersApi.list(EMPTY_FILTERS)
    })

    it('applies search/status/date_from/date_to/sort_by', async () => {
      server.use(http.get(API_ENDPOINTS.ORDERS, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('search')).toBe('דני')
        expect(url.searchParams.get('status')).toBe('ready')
        expect(url.searchParams.get('date_from')).toBe('2025-01-01')
        expect(url.searchParams.get('date_to')).toBe('2025-01-31')
        expect(url.searchParams.get('sort_by')).toBe('urgency')
        return HttpResponse.json({ items: [], total: 0, page: 1, page_size: 20, pages: 0 })
      }))
      await ordersApi.list({
        search: 'דני', status: 'ready', date_from: '2025-01-01', date_to: '2025-01-31', sort_by: 'urgency',
      })
    })

    it('maps payment_state=unpaid to is_paid=false', async () => {
      server.use(http.get(API_ENDPOINTS.ORDERS, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('is_paid')).toBe('false')
        expect(url.searchParams.get('payment_method')).toBeNull()
        return HttpResponse.json({ items: [], total: 0, page: 1, page_size: 20, pages: 0 })
      }))
      await ordersApi.list({ payment_state: 'unpaid' })
    })

    it('maps payment_state=cash to is_paid=true, payment_method=cash', async () => {
      server.use(http.get(API_ENDPOINTS.ORDERS, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('is_paid')).toBe('true')
        expect(url.searchParams.get('payment_method')).toBe('cash')
        return HttpResponse.json({ items: [], total: 0, page: 1, page_size: 20, pages: 0 })
      }))
      await ordersApi.list({ payment_state: 'cash' })
    })

    it('maps payment_state=transfer to is_paid=true, payment_method=transfer', async () => {
      server.use(http.get(API_ENDPOINTS.ORDERS, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('is_paid')).toBe('true')
        expect(url.searchParams.get('payment_method')).toBe('transfer')
        return HttpResponse.json({ items: [], total: 0, page: 1, page_size: 20, pages: 0 })
      }))
      await ordersApi.list({ payment_state: 'transfer' })
    })
  })
})
