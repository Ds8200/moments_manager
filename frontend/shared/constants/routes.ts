export const ROUTES = {
  HOME: '/home',
  ORDERS: '/orders',
  CUSTOMERS: '/customers',
  PRODUCTS: '/products',
  EXPENSES: '/expenses',
  REPORTS: '/reports',
  SEND_EMAIL: '/send-email',
  USERS: '/users',
  PROFILE: '/profile',
  LOGIN: '/login',
} as const

export interface NavItem {
  href: string
  label: string
  shortLabel?: string
  icon: string
  adminOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.HOME,  label: 'בית',          shortLabel: 'בית',        icon: '🏠' },
  { href: ROUTES.ORDERS,     label: 'הזמנות',      shortLabel: 'הזמנות',     icon: '📋' },
  { href: ROUTES.CUSTOMERS,  label: 'לקוחות',      shortLabel: 'לקוחות',     icon: '👥' },
  { href: ROUTES.PRODUCTS,   label: 'מוצרים',      shortLabel: 'מוצרים',     icon: '🎨' },
  { href: ROUTES.EXPENSES,   label: 'הוצאות',      shortLabel: 'הוצאות',     icon: '💸' },
  { href: ROUTES.REPORTS,    label: 'דוחות',       shortLabel: 'דוחות',      icon: '📊' },
  { href: ROUTES.SEND_EMAIL, label: 'שליחת מייל',  shortLabel: 'מייל',       icon: '✉️' },
  { href: ROUTES.USERS,      label: 'משתמשים',     shortLabel: 'משתמשים',    icon: '👤', adminOnly: true },
]
