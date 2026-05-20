import { http, HttpResponse } from 'msw'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'

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
]
