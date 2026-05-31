const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// DEBUG — remove after confirming env var is set correctly in Vercel
console.log('[DEBUG] NEXT_PUBLIC_API_URL =', process.env.NEXT_PUBLIC_API_URL)
console.log('[DEBUG] BASE =', BASE)

export const API_ENDPOINTS = {
  AUTH_LOGIN:   `${BASE}/api/v1/auth/login`,
  AUTH_REFRESH: `${BASE}/api/v1/auth/refresh`,
  AUTH_LOGOUT:  `${BASE}/api/v1/auth/logout`,

  CUSTOMERS:    `${BASE}/api/v1/customers`,
  CUSTOMER:     (id: string) => `${BASE}/api/v1/customers/${id}`,
  CUSTOMER_ORDERS: (id: string) => `${BASE}/api/v1/customers/${id}/orders`,

  PRODUCTS:     `${BASE}/api/v1/products`,
  PRODUCT:      (id: string) => `${BASE}/api/v1/products/${id}`,

  ORDERS:       `${BASE}/api/v1/orders`,
  ORDER:        (id: string) => `${BASE}/api/v1/orders/${id}`,
  ORDER_STATUS: (id: string) => `${BASE}/api/v1/orders/${id}/status`,
  ORDER_PAYMENT:(id: string) => `${BASE}/api/v1/orders/${id}/payment`,
  ORDER_FILES:  (id: string) => `${BASE}/api/v1/orders/${id}/files`,
  ORDER_FILE:   (orderId: string, fileId: string) => `${BASE}/api/v1/orders/${orderId}/files/${fileId}`,

  EXPENSES:     `${BASE}/api/v1/expenses`,
  EXPENSE:      (id: string) => `${BASE}/api/v1/expenses/${id}`,

  REPORTS_DASHBOARD: `${BASE}/api/v1/reports/dashboard`,
  REPORTS_MONTHLY:   `${BASE}/api/v1/reports/monthly`,
  REPORTS_FINANCIAL: `${BASE}/api/v1/reports/financial`,
  REPORTS_TOP_CUSTOMERS: `${BASE}/api/v1/reports/top-customers`,
} as const
