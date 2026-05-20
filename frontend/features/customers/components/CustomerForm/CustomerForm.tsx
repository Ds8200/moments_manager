'use client'
import { useCustomerForm } from './useCustomerForm'
import styles from './CustomerForm.module.scss'

const FORM_LABELS = {
  NEW_TITLE:  'לקוח חדש',
  EDIT_TITLE: 'עריכת לקוח',
  NAME:       'שם לקוח',
  PHONE:      'טלפון',
  EMAIL:      'אימייל',
  NOTES:      'הערות',
  CANCEL:     'ביטול',
  SAVE:       'שמור',
  SAVING:     'שומר...',
} as const

export function CustomerForm() {
  const {
    isOpen, isEditing, register, handleSubmit, onSubmit, errors, isSubmitting, onClose,
  } = useCustomerForm()

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
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>{FORM_LABELS.NAME}</label>
              <input className={`${styles.input}${errors.name ? ` ${styles.error}` : ''}`} {...register('name')} />
              {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{FORM_LABELS.PHONE}</label>
              <input type="tel" className={styles.input} {...register('phone')} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{FORM_LABELS.EMAIL}</label>
              <input type="email" className={`${styles.input}${errors.email ? ` ${styles.error}` : ''}`} {...register('email')} />
              {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
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
