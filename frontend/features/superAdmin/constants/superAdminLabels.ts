export const SUPER_ADMIN_LABELS = {
  PAGE_TITLE: 'ניהול עסקים',
  TABLE_COL_NAME: 'שם',
  TABLE_COL_SLUG: 'מזהה',
  TABLE_COL_PLAN: 'מנוי',
  TABLE_COL_STATUS: 'סטטוס',
  TABLE_COL_MEMBERS: 'חברים',
  TABLE_COL_CREATED: 'נוצר',
  TABLE_COL_ACTIONS: 'פעולות',

  PLAN_TRIAL: 'ניסיון',
  PLAN_BASIC: 'בסיסי',
  PLAN_PROFESSIONAL: 'מקצועי',
  PLAN_ENTERPRISE: 'ארגוני',

  STATUS_ACTIVE: 'פעיל',
  STATUS_INACTIVE: 'מושבת',

  TOGGLE_ACTIVATE: 'הפעלה',
  TOGGLE_DEACTIVATE: 'השבתה',
  CONFIRM_DEACTIVATE: 'להשבית את העסק? לא ניתן יהיה להתחבר עד להפעלה מחדש.',
  ORG_ACTIVATED_SUCCESS: 'העסק הופעל',
  ORG_DEACTIVATED_SUCCESS: 'העסק הושבת',
  ORG_STATUS_ERROR: 'עדכון סטטוס נכשל. נסו שוב',

  EMPTY: 'לא נמצאו עסקים',
  LOADING: 'טוען עסקים...',

  // Create org form
  CREATE_ORG_TITLE: 'יצירת עסק חדש',
  ADD_ORG_BUTTON: 'עסק חדש',
  FIELD_BUSINESS_NAME: 'שם העסק',
  FIELD_SLUG: 'מזהה (slug)',
  FIELD_SLUG_HINT: 'אותיות קטנות, מספרים ומקפים בלבד',
  FIELD_OWNER_EMAIL: 'אימייל בעל העסק',
  FIELD_OWNER_FULL_NAME: 'שם מלא בעל העסק',
  FIELD_OWNER_PASSWORD: 'סיסמה ראשונית',
  FIELD_PLAN: 'מנוי',
  SUBMIT_CREATE_ORG: 'צור עסק',
  SUBMITTING: 'שומר...',
  ORG_CREATED_SUCCESS: 'העסק נוצר בהצלחה',
  ORG_CREATE_ERROR: 'יצירת העסק נכשלה',
  VALIDATION_REQUIRED: 'שדה חובה',
  VALIDATION_SLUG: 'מזהה: אותיות קטנות, מספרים ומקפים בלבד',
  VALIDATION_EMAIL: 'כתובת אימייל לא תקינה',
  VALIDATION_PASSWORD_MIN: 'סיסמה חייבת להכיל לפחות 8 תווים',
  BACK_TO_ORGS: 'חזרה לרשימה',

  // Row action menu
  MENU_DETAILS:        'פרטים',
  MENU_DISABLE:        'השבתה',
  MENU_ENABLE:         'הפעלה',
  MENU_DELETE:         'מחיקה',
  MENU_RESET_PASSWORD: 'איפוס סיסמה',

  CONFIRM_DELETE:         'למחוק את העסק לצמיתות? לא ניתן לשחזר.',
  CONFIRM_RESET_PASSWORD: 'לשלוח מייל איפוס סיסמה לבעל העסק?',

  ORG_DELETED_SUCCESS:        'העסק נמחק',
  ORG_DELETE_ERROR:           'מחיקת העסק נכשלה',
  ORG_PASSWORD_RESET_SUCCESS: 'מייל איפוס סיסמה נשלח',
  ORG_PASSWORD_RESET_ERROR:   'שליחת מייל נכשלה',

  // OrgDetail edit form
  EDIT_ORG_BUTTON:     'ערוך',
  SAVE_CHANGES:        'שמור שינויים',
  CANCEL_EDIT:         'ביטול',
  ORG_UPDATED_SUCCESS: 'פרטי העסק עודכנו',
  ORG_UPDATE_ERROR:    'עדכון פרטי העסק נכשל',
  FIELD_ORG_NAME:      'שם העסק',

  // Table columns
  TABLE_COL_ORG_NUMBER:      'מספר',
  TABLE_COL_OWNER_EMAIL:     'בעלים',
  TABLE_COL_FULL_NAME:       'שם מלא',
  TABLE_COL_PHONE:           'טלפון',
  TABLE_COL_NUM_BUSINESSES:  'עסקים',

  // Org form modal
  MODAL_CREATE_ORG_TITLE:    'יצירת עסק חדש',
  MODAL_EDIT_ORG_TITLE:      'עריכת עסק',
  FIELD_OWNER_PICKER:        'בעל העסק',
  OWNER_PICKER_PLACEHOLDER:  'חפשו לפי שם או אימייל',
  CREATE_NEW_USER_OPTION:    '+ צור משתמש חדש',
  ORG_NUMBER_AUTO_ASSIGNED:  'יוקצה אוטומטית',
  VALIDATION_OWNER_REQUIRED: 'יש לבחור בעל עסק קיים או ליצור משתמש חדש',
  FIELD_PASSWORD:            'סיסמה ראשונית',
  SUBMIT_SAVE:               'שמור',
  CANCEL:                    'ביטול',

  // User form modal
  MODAL_CREATE_USER_TITLE: 'יצירת משתמש חדש',
  FIELD_USER_EMAIL:        'אימייל',
  FIELD_USER_FULL_NAME:    'שם מלא',
  FIELD_USER_PHONE:        'טלפון (אופציונלי)',
  FIELD_USER_PASSWORD:     'סיסמה',
  SUBMIT_CREATE_USER:      'שמור',

  // Users tab actions
  CANNOT_DELETE_USER_WITH_ORGS: 'לא ניתן למחוק משתמש שמחזיק בעסק פעיל',
  USER_DELETED_SUCCESS:         'המשתמש נמחק',
  USER_DELETE_ERROR:            'מחיקת המשתמש נכשלה',
  CONFIRM_DELETE_USER:          'למחוק את המשתמש לצמיתות?',

  // Filters
  FILTER_ALL_PLANS:    'כל המנויים',
  FILTER_ALL_STATUSES: 'כל הסטטוסים',
  FILTER_ACTIVE:       'פעיל',
  FILTER_INACTIVE:     'מושבת',
  FILTER_SEARCH_PLACEHOLDER: 'חיפוש...',

  // Row action menu
  MENU_EDIT: 'עריכה',

  // Pagination
  PAGINATION_TOTAL_PREFIX: 'סה"כ',
  PAGINATION_ORGS_SUFFIX:  'עסקים',
  PAGINATION_USERS_SUFFIX: 'משתמשים',
  PAGINATION_PREV:         'הקודם',
  PAGINATION_NEXT:         'הבא',

  EMPTY_ORGS:  'לא נמצאו עסקים',
  EMPTY_USERS: 'לא נמצאו משתמשים',
  ERROR_LOAD:  'שגיאה בטעינת הנתונים',
  USER_DETAIL_TITLE: 'פרטי משתמש',
} as const
