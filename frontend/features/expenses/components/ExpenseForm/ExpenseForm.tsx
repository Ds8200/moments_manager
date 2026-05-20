'use client'
import { useExpenseForm } from './useExpenseForm'
import { EXPENSE_CATEGORY_LABELS } from '@/shared/enums/statusEnums'
import styles from './ExpenseForm.module.scss'

const FORM_LABELS = {
  NEW_TITLE:  'הוצאה חדשה',
  EDIT_TITLE: 'עריכת הוצאה',
  DATE:       'תאריך',
  CATEGORY:   'קטגוריה',
  AMOUNT:     'סכום',
  NOTES:      'הערות',
  CANCEL:     'ביטול',
  SAVE:       'שמור',
  SAVING:     'שומר...',
} as const

export function ExpenseForm() {
  const {
    isOpen, isEditing, register, handleSubmit, onSubmit,
    errors, isSubmitting, onClose, categories,
  } = useExpenseForm()

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditing ? FORM_LABELS.EDIT_TITLE : FORM_LABELS.NEW_TITLE}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>{FORM_LABELS.DATE}</label>
              <input type="date" className={`${styles.input}${errors.date ? ` ${styles.error}` : ''}`} {...register('date')} />
              {errors.date && <span className={styles.errorText}>{errors.date.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{FORM_LABELS.CATEGORY}</label>
              <select className={styles.input} {...register('category')}>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{EXPENSE_CATEGORY_LABELS[cat] ?? cat}</option>
                ))}
              </select>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>{FORM_LABELS.AMOUNT}</label>
              <input className={`${styles.input}${errors.amount ? ` ${styles.error}` : ''}`} placeholder="₪" {...register('amount')} />
              {errors.amount && <span className={styles.errorText}>{errors.amount.message}</span>}
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>{FORM_LABELS.NOTES}</label>
              <textarea className={styles.textarea} {...register('notes')} />
            </div>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{FORM_LABELS.CANCEL}</button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? FORM_LABELS.SAVING : FORM_LABELS.SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
