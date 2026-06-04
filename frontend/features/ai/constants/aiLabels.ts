import type { SuggestedPrompt } from '@/features/ai/types'

export const AI_LABELS = {
  NAV_LABEL:           'Moments AI',
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
  { id: 'email',     label: 'טיוטת מייל',     prompt: 'נסח מייל תזכורת תשלום ללקוח' },
  { id: 'profit',    label: 'רווחיות',        prompt: 'מה הרווח הנקי השנה עד כה?' },
]
