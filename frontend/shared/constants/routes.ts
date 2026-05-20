export const ROUTES = {
  DASHBOARD: '/dashboard',
  ORDERS: '/orders',
  CUSTOMERS: '/customers',
  PRODUCTS: '/products',
  EXPENSES: '/expenses',
  REPORTS: '/reports',
  LOGIN: '/login',
} as const

export interface NavItem {
  href: string
  label: string
  shortLabel?: string
  icon: string
}

export const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.DASHBOARD,  label: 'דשבורד',    shortLabel: 'בית',      icon: '🏠' },
  { href: ROUTES.ORDERS,     label: 'הזמנות',    shortLabel: 'הזמנות',   icon: '📋' },
  { href: ROUTES.CUSTOMERS,  label: 'לקוחות',    shortLabel: 'לקוחות',   icon: '👥' },
  { href: ROUTES.PRODUCTS,   label: 'מוצרים',    shortLabel: 'מוצרים',   icon: '🎨' },
  { href: ROUTES.EXPENSES,   label: 'הוצאות',    shortLabel: 'הוצאות',   icon: '💸' },
  { href: ROUTES.REPORTS,    label: 'דוחות',     shortLabel: 'דוחות',    icon: '📊' },
]
