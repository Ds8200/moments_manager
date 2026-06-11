export const API_ENDPOINTS = {
  AUTH_LOGIN:   '/api/v1/auth/login',
  AUTH_REFRESH: '/api/v1/auth/refresh',
  AUTH_LOGOUT:  '/api/v1/auth/logout',
  AUTH_MAGIC_LOGIN: '/api/v1/auth/magic-login',

  CUSTOMERS:    '/api/v1/customers',
  CUSTOMER:     (id: string) => `/api/v1/customers/${id}`,
  CUSTOMER_ORDERS: (id: string) => `/api/v1/customers/${id}/orders`,

  PRODUCT_CATEGORIES:  '/api/v1/product-categories',
  PRODUCT_CATEGORY:    (id: string) => `/api/v1/product-categories/${id}`,

  EXPENSE_CATEGORIES:  '/api/v1/expense-categories',
  EXPENSE_CATEGORY:    (id: string) => `/api/v1/expense-categories/${id}`,

  PRODUCTS:     '/api/v1/products',
  PRODUCT:      (id: string) => `/api/v1/products/${id}`,

  ORDERS:       '/api/v1/orders',
  ORDER:        (id: string) => `/api/v1/orders/${id}`,
  ORDER_STATUS:  (id: string) => `/api/v1/orders/${id}/status`,
  ORDER_PAYMENT: (id: string) => `/api/v1/orders/${id}/payment`,
  ORDER_URGENCY: (id: string) => `/api/v1/orders/${id}/urgency`,
  ORDER_FILES:  (id: string) => `/api/v1/orders/${id}/files`,
  ORDER_FILE:   (orderId: string, fileId: string) => `/api/v1/orders/${orderId}/files/${fileId}`,

  EXPENSES:     '/api/v1/expenses',
  EXPENSE:      (id: string) => `/api/v1/expenses/${id}`,

  REPORTS_HOME:          '/api/v1/reports/dashboard',
  REPORTS_MONTHLY:       '/api/v1/reports/monthly',
  REPORTS_FINANCIAL:     '/api/v1/reports/financial',
  REPORTS_TOP_CUSTOMERS: '/api/v1/reports/top-customers',
  REPORTS_EXPORT_EXCEL:  '/api/v1/reports/export/excel',
  REPORTS_EXPORT_PDF:    '/api/v1/reports/export/pdf',

  COMPOSE_EMAIL: '/api/v1/customers/compose-email',

  USERS: '/api/v1/users',
  USER: (id: string) => `/api/v1/users/${id}`,
  ME: '/api/v1/users/me',

  AI_CHAT: '/api/v1/ai/chat',

  ORGS_ME:        '/api/v1/orgs/me',
  ORGS_ME_LOGO:   '/api/v1/orgs/me/logo',
  ORGS_ME_MEMBERS: '/api/v1/orgs/me/members',
  ORGS_ME_MEMBER: (userId: string) => `/api/v1/orgs/me/members/${userId}`,
  ORGS_ME_INVITE: '/api/v1/orgs/me/invite',

  REGISTER: '/api/v1/register',

  ADMIN_ORGS:        '/api/v1/admin/orgs',
  ADMIN_ORG:         (id: string) => `/api/v1/admin/orgs/${id}`,
  ADMIN_ORG_STATUS:  (id: string) => `/api/v1/admin/orgs/${id}/status`,
  ADMIN_ORG_PLAN:    (id: string) => `/api/v1/admin/orgs/${id}/plan`,
  ADMIN_ORG_RESET_PASSWORD: (id: string) => `/api/v1/admin/orgs/${id}/reset-password`,
  ADMIN_ORG_OWNERS:  '/api/v1/admin/org-owners',
  ADMIN_ORG_USERS:        '/api/v1/admin/orgs/users',
  ADMIN_ORG_USERS_SEARCH: '/api/v1/admin/orgs/users/search',
  ADMIN_ORG_USER:         (id: string) => `/api/v1/admin/orgs/users/${id}`,
  ADMIN_EMAIL_COMPOSE: '/api/v1/admin/email/compose',
  ADMIN_SETTINGS:    '/api/v1/admin/settings',
  ADMIN_SETTINGS_SMTP:     '/api/v1/admin/settings/smtp',
  ADMIN_SETTINGS_OPENAI:   '/api/v1/admin/settings/openai',
  ADMIN_SETTINGS_PASSWORD: '/api/v1/admin/settings/password',

  ORG_BRANDING: (slug: string) => `/api/v1/orgs/branding/${slug}`,
} as const
