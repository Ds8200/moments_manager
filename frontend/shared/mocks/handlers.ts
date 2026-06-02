import { http, HttpResponse } from 'msw'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'

const EMPTY_PAGE = { items: [], total: 0, page: 1, page_size: 20, pages: 1 }

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
]
