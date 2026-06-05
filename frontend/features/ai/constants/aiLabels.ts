import type { SuggestedPrompt } from '@/features/ai/types'

export const TOOL_LABELS: Record<string, string> = {
  get_dashboard_kpis:      'בודק נתוני לוח בקרה',
  get_monthly_report:      'מנתח דוח חודשי',
  get_financial_year:      'טוען נתונים שנתיים',
  get_top_customers:       'מחפש לקוחות מובילים',
  get_orders_summary:      'סופר הזמנות',
  get_recent_orders:       'טוען הזמנות אחרונות',
  get_overdue_orders:      'בודק הזמנות עוברות זמן',
  get_monthly_comparison:  'משווה חודשים',
  get_expense_breakdown:   'מנתח הוצאות',
  get_customer_detail:     'מחפש פרטי לקוח',
  get_unpaid_invoices:     'בודק חובות פתוחים',
  get_pipeline_value:      'מחשב ערך הצנרת',
  get_product_performance: 'מנתח ביצועי מוצרים',
  search_orders:           'מחפש הזמנות',
  get_inactive_customers:  'מזהה לקוחות לא פעילים',
  get_order_items:         'טוען פרטי הזמנה',
  get_product_catalog:     'טוען קטלוג מוצרים',
  draft_email:             'מנסח מייל',
}

export const ANALYZING_DEFAULT = 'מנתח נתונים'

export const AI_LABELS = {
  NAV_LABEL:           'Moments AI',
  SEND_EMAIL_CTA:      'שלח מייל ←',
  SEND_BULK_EMAIL_CTA: 'שלח לכל הלקוחות ←',
  PAGE_TITLE:          'Moments AI',
  PAGE_SUBTITLE:       'עוזר עסקי חכם',
  CLEAR_BUTTON:        'שיחה חדשה',
  SEND_BUTTON:         'שלח',
  SEND_BUTTON_ARIA:    'שלח הודעה',
  INPUT_PLACEHOLDER:   'שאל שאלה על העסק שלך...',
  STREAMING_LABEL:     'מנסח תשובה...',
  ERROR_RETRY:         'נסה שנית',
  ERROR_GENERIC:       'אירעה שגיאה. אנא נסה שנית.',
  EMPTY_STATE_TITLE:   'שאל אותי כל שאלה על העסק',
  EMPTY_STATE_SUBTITLE:'אני יכול לעזור עם נתוני הזמנות, לקוחות, פיננסים ועוד',
  YOU_LABEL:           'אתה',
  AI_LABEL:            'Moments AI',
} as const

export const AI_SUGGESTED_PROMPTS: readonly SuggestedPrompt[] = [
  { id: 'kpi',       label: 'סטטוס כללי',    prompt: 'מה הסטטוס הכללי של העסק החודש?' },
  { id: 'revenue',   label: 'הכנסות החודש',   prompt: 'כמה הכנסות היו החודש?' },
  { id: 'customers', label: 'לקוחות מובילים', prompt: 'מי הלקוחות המובילים שלי?' },
  { id: 'orders',    label: 'הזמנות פתוחות',  prompt: 'כמה הזמנות פתוחות יש כרגע?' },
  { id: 'email',     label: 'טיוטת מייל',     prompt: 'נסח לי מייל' },
  { id: 'profit',    label: 'רווחיות',        prompt: 'מה הרווח הנקי השנה עד כה?' },
]
