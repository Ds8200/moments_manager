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

const ORG_ADMIN_STUB = {
  id: 'org-new-1',
  slug: 'new-org',
  name: 'New Org',
  logo_path: null,
  plan: 'trial',
  trial_ends_at: null,
  is_active: true,
  max_users: 2,
  owner_id: 'owner-1',
  member_count: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const handlers = [
  http.post(API_ENDPOINTS.ADMIN_ORGS, () => HttpResponse.json(ORG_ADMIN_STUB, { status: 201 })),
  http.get(API_ENDPOINTS.PRODUCT_CATEGORIES, () => HttpResponse.json([])),
  http.post(API_ENDPOINTS.PRODUCT_CATEGORIES, async ({ request }) => {
    const body = await request.json() as { name: string }
    return HttpResponse.json(
      { id: 'cat-1', name: body.name, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
      { status: 201 },
    )
  }),
  http.delete(API_ENDPOINTS.PRODUCT_CATEGORY(':id'), () => new HttpResponse(null, { status: 204 })),
  http.get(API_ENDPOINTS.EXPENSE_CATEGORIES, () => HttpResponse.json([])),
  http.post(API_ENDPOINTS.EXPENSE_CATEGORIES, async ({ request }) => {
    const body = await request.json() as { name: string }
    return HttpResponse.json(
      { id: 'ecat-1', name: body.name, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
      { status: 201 },
    )
  }),
  http.delete(API_ENDPOINTS.EXPENSE_CATEGORY(':id'), () => new HttpResponse(null, { status: 204 })),
  http.get(API_ENDPOINTS.REPORTS_HOME, () =>
    HttpResponse.json({
      open_orders: 0,
      ready_orders: 0,
      monthly_revenue: '0',
      monthly_expenses: '0',
      monthly_profit: '0',
      unpaid_amount: '0',
      today_orders: 0,
    })
  ),
  http.get(API_ENDPOINTS.CUSTOMERS, () => HttpResponse.json(EMPTY_PAGE)),
  http.get(API_ENDPOINTS.PRODUCTS,  () => HttpResponse.json(EMPTY_PAGE)),
  http.get(API_ENDPOINTS.USERS,     () => HttpResponse.json(EMPTY_PAGE)),
  http.post(API_ENDPOINTS.AUTH_LOGOUT, () => new HttpResponse(null, { status: 204 })),
  http.get(API_ENDPOINTS.REPORTS_FINANCIAL, () =>
    HttpResponse.json({
      year: new Date().getFullYear(),
      annual_revenue: '60000',
      annual_profit: '24000',
      annual_expenses: '12000',
      annual_net: '24000',
      annual_unpaid: '3000',
      months: Array.from({ length: 12 }, (_, i) => ({
        year: new Date().getFullYear(),
        month: i + 1,
        total_revenue: '5000',
        total_cost: '2000',
        total_profit: '3000',
        total_expenses: '1000',
        net_profit: '2000',
        paid_count: 5,
        unpaid_count: 1,
        total_count: 6,
        collection_rate: 83.3,
        cash_revenue: '2500',
        transfer_revenue: '2500',
        unpaid_amount: '500',
        paid_revenue: '4500',
      })),
    })
  ),
  http.patch(API_ENDPOINTS.ORDER_URGENCY(':id'), async ({ request, params }) => {
    const body = await request.json() as { urgency: string }
    return HttpResponse.json({ ...ORDER_STUB, id: params['id'] as string, urgency: body.urgency })
  }),
]
