export type OrderStatus =
  | 'new'
  | 'waiting_approval'
  | 'approved'
  | 'printing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new:              'חדשה',
  waiting_approval: 'לאישור',
  approved:         'מאושרת',
  printing:         'בהדפסה',
  ready:            'מוכנה',
  completed:        'הושלמה',
  cancelled:        'בוטלה',
}

export const STATUS_ORDER: OrderStatus[] = [
  'new', 'waiting_approval', 'approved', 'printing', 'ready', 'completed',
]

export type PaymentMethod = 'cash' | 'transfer' | 'partial'

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash:     'מזומן',
  transfer: 'העברה',
  partial:  'חלקי',
}

export type PaymentState = 'unpaid' | 'transfer' | 'cash'

export const PAYMENT_STATE_LABELS: Record<PaymentState, string> = {
  unpaid:   'לא שולם',
  transfer: 'בהעברה',
  cash:     'במזומן',
}

export const PAYMENT_STATE_ORDER: PaymentState[] = ['unpaid', 'transfer', 'cash']

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  ink:       'דיו וצבעים',
  materials: 'חומרי גלם',
  equipment: 'ציוד',
  shipping:  'משלוחים',
  utilities: 'חשמל/מים',
  other:     'אחר',
}
