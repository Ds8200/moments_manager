export const HOME_KPI_LABELS = {
  OPEN_ORDERS:       'הזמנות פתוחות',
  READY_ORDERS:      'מוכנות לאיסוף',
  MONTHLY_REVENUE:   'הכנסות החודש',
  MONTHLY_EXPENSES:  'הוצאות החודש',
  UNPAID_AMOUNT:     'ממתין לתשלום',
  MONTHLY_PROFIT:    'רווח החודש',
} as const

export const HOME_CHART_LABELS = {
  TITLE:    'הכנסות מול הוצאות — 6 חודשים אחרונים',
  REVENUE:  'הכנסות',
  EXPENSES: 'הוצאות',
  NO_DATA:  'אין נתונים להצגה',
} as const

export const CHART_MONTH_LABELS: readonly string[] = [
  'ינ׳', 'פב׳', 'מר׳', 'אפ׳', 'מי׳', 'יו׳',
  'יל׳', 'אג׳', 'ספ׳', 'אוק׳', 'נו׳', 'דצ׳',
]
