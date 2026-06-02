import { http, HttpResponse } from 'msw'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'

const EMPTY_PAGE = { items: [], total: 0, page: 1, page_size: 20, pages: 1 }

const ORDER_STUB = {
  id: 'order-1',
  order_number: 'HZ-0001',
  customer_id: null,
  customer_name: null,
  date: '2025-01-01',
  due_datetime: null,
  urgency: 'normal',
  status: 'new',
  is_paid: false,
  payment_method: null,
  total_amount: '0',
  total_cost: '0',
  total_profit: '0',
  notes: null,
  items: [],
  files: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

export const handlers = [
  http.get(API_ENDPOINTS.REPORTS_DASHBOARD, () =>
    HttpResponse.json({
      open_orders: 0,
      ready_orders: 0,
      monthly_revenue: '0',
      monthly_profit: '0',
      unpaid_amount: '0',
      today_orders: 0,
    })
  ),
  http.get(API_ENDPOINTS.CUSTOMERS, () => HttpResponse.json(EMPTY_PAGE)),
  http.get(API_ENDPOINTS.PRODUCTS,  () => HttpResponse.json(EMPTY_PAGE)),
  http.patch(API_ENDPOINTS.ORDER_URGENCY(':id'), async ({ request, params }) => {
    const body = await request.json() as { urgency: string }
    return HttpResponse.json({ ...ORDER_STUB, id: params['id'] as string, urgency: body.urgency })
  }),
]
