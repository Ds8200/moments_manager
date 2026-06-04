const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

export const API_ENDPOINTS = {
  AUTH_LOGIN:   `${BASE}/api/v1/auth/login`,
  AUTH_REFRESH: `${BASE}/api/v1/auth/refresh`,
  AUTH_LOGOUT:  `${BASE}/api/v1/auth/logout`,
  AUTH_MAGIC_LOGIN: `${BASE}/api/v1/auth/magic-login`,

  CUSTOMERS:    `${BASE}/api/v1/customers`,
  CUSTOMER:     (id: string) => `${BASE}/api/v1/customers/${id}`,
  CUSTOMER_ORDERS: (id: string) => `${BASE}/api/v1/customers/${id}/orders`,

  PRODUCT_CATEGORIES:  `${BASE}/api/v1/product-categories`,
  PRODUCT_CATEGORY:    (id: string) => `${BASE}/api/v1/product-categories/${id}`,

  EXPENSE_CATEGORIES:  `${BASE}/api/v1/expense-categories`,
  EXPENSE_CATEGORY:    (id: string) => `${BASE}/api/v1/expense-categories/${id}`,

  PRODUCTS:     `${BASE}/api/v1/products`,
  PRODUCT:      (id: string) => `${BASE}/api/v1/products/${id}`,

  ORDERS:       `${BASE}/api/v1/orders`,
  ORDER:        (id: string) => `${BASE}/api/v1/orders/${id}`,
  ORDER_STATUS:  (id: string) => `${BASE}/api/v1/orders/${id}/status`,
  ORDER_PAYMENT: (id: string) => `${BASE}/api/v1/orders/${id}/payment`,
  ORDER_URGENCY: (id: string) => `${BASE}/api/v1/orders/${id}/urgency`,
  ORDER_FILES:  (id: string) => `${BASE}/api/v1/orders/${id}/files`,
  ORDER_FILE:   (orderId: string, fileId: string) => `${BASE}/api/v1/orders/${orderId}/files/${fileId}`,

  EXPENSES:     `${BASE}/api/v1/expenses`,
  EXPENSE:      (id: string) => `${BASE}/api/v1/expenses/${id}`,

  REPORTS_HOME:          `${BASE}/api/v1/reports/dashboard`,
  REPORTS_MONTHLY:       `${BASE}/api/v1/reports/monthly`,
  REPORTS_FINANCIAL:     `${BASE}/api/v1/reports/financial`,
  REPORTS_TOP_CUSTOMERS: `${BASE}/api/v1/reports/top-customers`,
  REPORTS_EXPORT_EXCEL:  `${BASE}/api/v1/reports/export/excel`,
  REPORTS_EXPORT_PDF:    `${BASE}/api/v1/reports/export/pdf`,

  COMPOSE_EMAIL: `${BASE}/api/v1/customers/compose-email`,

  USERS: `${BASE}/api/v1/users`,
  USER: (id: string) => `${BASE}/api/v1/users/${id}`,
  ME: `${BASE}/api/v1/users/me`,
} as const
