'use client'
import { useOrderForm } from './useOrderForm'
import styles from './OrderForm.module.scss'

const FORM_LABELS = {
  NEW_TITLE:    'הזמנה חדשה',
  EDIT_TITLE:   'עריכת הזמנה',
  CUSTOMER:     'לקוח (מזהה)',
  DATE:         'תאריך',
  TARGET:       'יעד / מועד',
  NOTES:        'הערות',
  ITEMS:        'פריטים',
  ITEM_NAME:    'מוצר',
  ITEM_QTY:     'כמות',
  ITEM_PRICE:   'מחיר',
  ITEM_COST:    'עלות',
  ADD_ITEM:     '+ הוסף פריט',
  CANCEL:       'ביטול',
  SAVE:         'שמור',
  SAVING:       'שומר...',
} as const

export function OrderForm() {
  const {
    isOpen,
    isEditing,
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    fields,
    appendItem,
    removeItem,
    onClose,
  } = useOrderForm()

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? FORM_LABELS.EDIT_TITLE : FORM_LABELS.NEW_TITLE}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>{FORM_LABELS.CUSTOMER}</label>
              <input
                className={`${styles.input}${errors.customer_id ? ` ${styles.error}` : ''}`}
                {...register('customer_id')}
              />
              {errors.customer_id && <span className={styles.errorText}>{errors.customer_id.message}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{FORM_LABELS.DATE}</label>
              <input
                type="date"
                className={`${styles.input}${errors.date ? ` ${styles.error}` : ''}`}
                {...register('date')}
              />
              {errors.date && <span className={styles.errorText}>{errors.date.message}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{FORM_LABELS.TARGET}</label>
              <input
                className={styles.input}
                placeholder="שישי, ראשון בלילה..."
                {...register('target_description')}
              />
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>{FORM_LABELS.NOTES}</label>
              <textarea className={styles.textarea} {...register('notes')} />
            </div>
          </div>

          <div className={styles.sectionTitle}>{FORM_LABELS.ITEMS}</div>

          {fields.map((field, idx) => (
            <div key={field.id} className={styles.itemRow}>
              <div className={styles.field}>
                {idx === 0 && <label className={styles.label}>{FORM_LABELS.ITEM_NAME}</label>}
                <input
                  className={`${styles.input}${errors.items?.[idx]?.product_name ? ` ${styles.error}` : ''}`}
                  placeholder="שם המוצר"
                  {...register(`items.${idx}.product_name`)}
                />
              </div>
              <div className={styles.field}>
                {idx === 0 && <label className={styles.label}>{FORM_LABELS.ITEM_QTY}</label>}
                <input
                  type="number"
                  min={1}
                  className={styles.input}
                  {...register(`items.${idx}.quantity`)}
                />
              </div>
              <div className={styles.field}>
                {idx === 0 && <label className={styles.label}>{FORM_LABELS.ITEM_PRICE}</label>}
                <input
                  type="number"
                  step="0.01"
                  className={`${styles.input}${errors.items?.[idx]?.unit_price ? ` ${styles.error}` : ''}`}
                  placeholder="₪"
                  {...register(`items.${idx}.unit_price`)}
                />
              </div>
              <div className={styles.field}>
                {idx === 0 && <label className={styles.label}>{FORM_LABELS.ITEM_COST}</label>}
                <input
                  type="number"
                  step="0.01"
                  className={styles.input}
                  placeholder="₪"
                  {...register(`items.${idx}.unit_cost`)}
                />
              </div>
              <button
                type="button"
                className={styles.removeItemBtn}
                onClick={() => removeItem(idx)}
                disabled={fields.length === 1}
              >
                ✕
              </button>
            </div>
          ))}

          <button type="button" className={styles.addItemBtn} onClick={appendItem}>
            {FORM_LABELS.ADD_ITEM}
          </button>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {FORM_LABELS.CANCEL}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? FORM_LABELS.SAVING : FORM_LABELS.SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
