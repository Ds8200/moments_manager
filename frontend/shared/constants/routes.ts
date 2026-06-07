export const ROUTES = {
  HOME: '/home',
  ORDERS: '/orders',
  CUSTOMERS: '/customers',
  PRODUCTS: '/products',
  EXPENSES: '/expenses',
  REPORTS: '/reports',
  SEND_EMAIL: '/send-email',
  AI: '/ai',
  USERS: '/users',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/onboarding',
  SUPER_ADMIN_ORGS: '/orgs',
  SUPER_ADMIN_NEW_ORG: '/orgs/new',
  SUPER_ADMIN_PROFILE: '/orgs/profile',
} as const

export const ORDER_DETAIL_ROUTE = (id: string): string => `/orders/${id}`

export const ROUTE_ICONS = {
  HOME:      '🏠',
  ORDERS:    '📋',
  CUSTOMERS: '👥',
  PRODUCTS:  '🎨',
  EXPENSES:  '💸',
  REPORTS:   '📊',
  EMAIL:     '✉️',
  AI:        '🤖',
  USERS:     '👤',
  ORGS:      '🏢',
} as const

export interface NavItem {
  href: string
  label: string
  shortLabel?: string
  icon: string
  adminOnly?: boolean
}

export const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
  { href: ROUTES.SUPER_ADMIN_ORGS, label: 'ניהול עסקים', shortLabel: 'עסקים', icon: ROUTE_ICONS.ORGS },
]

export const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.HOME,       label: 'בית',         shortLabel: 'בית',      icon: ROUTE_ICONS.HOME },
  { href: ROUTES.ORDERS,     label: 'הזמנות',      shortLabel: 'הזמנות',   icon: ROUTE_ICONS.ORDERS },
  { href: ROUTES.CUSTOMERS,  label: 'לקוחות',      shortLabel: 'לקוחות',   icon: ROUTE_ICONS.CUSTOMERS },
  { href: ROUTES.PRODUCTS,   label: 'מוצרים',      shortLabel: 'מוצרים',   icon: ROUTE_ICONS.PRODUCTS },
  { href: ROUTES.EXPENSES,   label: 'הוצאות',      shortLabel: 'הוצאות',   icon: ROUTE_ICONS.EXPENSES },
  { href: ROUTES.REPORTS,    label: 'דוחות',       shortLabel: 'דוחות',    icon: ROUTE_ICONS.REPORTS },
  { href: ROUTES.SEND_EMAIL, label: 'שליחת מייל',  shortLabel: 'מייל',     icon: ROUTE_ICONS.EMAIL },
  { href: ROUTES.AI,         label: 'עוזר AI',     shortLabel: 'AI',       icon: ROUTE_ICONS.AI },
  { href: ROUTES.USERS,      label: 'משתמשים',     shortLabel: 'משתמשים',  icon: ROUTE_ICONS.USERS, adminOnly: true },
]
