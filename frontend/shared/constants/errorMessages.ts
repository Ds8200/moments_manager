import { ERROR_CODES } from './errorCodes'

export const ERROR_MESSAGES = {
  GENERIC: 'אירעה שגיאה. נסה שנית.',
  NOT_FOUND: 'הפריט לא נמצא.',
  UNAUTHORIZED: 'נא להתחבר מחדש.',
  SERVER_ERROR: 'שגיאת שרת. נסה מאוחר יותר.',
  NETWORK_ERROR: 'בעיית חיבור. בדוק את האינטרנט.',
} as const

// Maps a backend error `code` to a clear Hebrew message shown to the user.
// A code with no entry here falls back to the server message, then to GENERIC.
export const ERROR_CODE_MESSAGES: Record<string, string> = {
  [ERROR_CODES.VALIDATION_ERROR]: 'חלק מהפרטים שהוזנו שגויים. בדוק ונסה שנית.',
  [ERROR_CODES.NOT_FOUND]: ERROR_MESSAGES.NOT_FOUND,
  [ERROR_CODES.CONFLICT]: 'הפעולה מתנגשת עם נתון קיים.',
  [ERROR_CODES.UNAUTHORIZED]: ERROR_MESSAGES.UNAUTHORIZED,
  [ERROR_CODES.FORBIDDEN]: 'אין לך הרשאה לבצע פעולה זו.',
  [ERROR_CODES.FILE_TOO_LARGE]: 'הקובץ גדול מדי.',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'סוג הקובץ אינו נתמך.',
  [ERROR_CODES.INTERNAL_ERROR]: ERROR_MESSAGES.SERVER_ERROR,
  [ERROR_CODES.USER_EMAIL_EXISTS]: 'משתמש עם אימייל זה כבר קיים במערכת.',
  [ERROR_CODES.CANNOT_DELETE_SELF]: 'לא ניתן למחוק את המשתמש שלך.',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'אימייל או סיסמה שגויים.',
  [ERROR_CODES.TOKEN_INVALID]: ERROR_MESSAGES.UNAUTHORIZED,
  [ERROR_CODES.REFRESH_TOKEN_INVALID]: ERROR_MESSAGES.UNAUTHORIZED,
  [ERROR_CODES.MAGIC_LINK_INVALID]: 'קישור הכניסה אינו תקין או שפג תוקפו.',
  [ERROR_CODES.AI_NOT_CONFIGURED]: 'שירות הבינה המלאכותית אינו מוגדר. פנה למנהל המערכת להגדרת מפתח API.',
}
