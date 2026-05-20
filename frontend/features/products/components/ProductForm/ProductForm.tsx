'use client'
import { useProductForm } from './useProductForm'
import styles from './ProductForm.module.scss'

const FORM_LABELS = {
  NEW_TITLE:  'מוצר חדש',
  EDIT_TITLE: 'עריכת מוצר',
  NAME:       'שם מוצר',
  CATEGORY:   'קטגוריה',
  PRICE:      'מחיר בסיס',
  COST:       'עלות בסיס',
  PROD_DAYS:  'ימי ייצור ממוצע',
  IS_ACTIVE:  'מוצר פעיל',
  CANCEL:     'ביטול',
  SAVE:       'שמור',
  SAVING:     'שומר...',
} as const

export function ProductForm() {
  const {
    isOpen, isEditing, register, handleSubmit, onSubmit, errors, isSubmitting, onClose,
  } = useProductForm()

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
              <label className={styles.label}>{FORM_LABELS.NAME}</label>
              <input className={`${styles.input}${errors.name ? ` ${styles.error}` : ''}`} {...register('name')} />
              {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{FORM_LABELS.CATEGORY}</label>
              <input className={styles.input} {...register('category')} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{FORM_LABELS.PRICE}</label>
              <input className={`${styles.input}${errors.base_price ? ` ${styles.error}` : ''}`} placeholder="₪" {...register('base_price')} />
              {errors.base_price && <span className={styles.errorText}>{errors.base_price.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{FORM_LABELS.COST}</label>
              <input className={`${styles.input}${errors.base_cost ? ` ${styles.error}` : ''}`} placeholder="₪" {...register('base_cost')} />
              {errors.base_cost && <span className={styles.errorText}>{errors.base_cost.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{FORM_LABELS.PROD_DAYS}</label>
              <input type="number" className={styles.input} {...register('avg_production_days', { valueAsNumber: true })} />
            </div>
            <div className={`${styles.field} ${styles.checkboxField}`}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('is_active')} />
                {FORM_LABELS.IS_ACTIVE}
              </label>
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
