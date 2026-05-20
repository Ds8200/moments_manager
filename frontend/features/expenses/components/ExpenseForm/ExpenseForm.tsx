'use client'
import type { ReactElement } from 'react'
import { useExpenseForm } from './useExpenseForm'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import { EXPENSE_CATEGORY_LABELS } from '@/shared/enums/statusEnums'
import styles from './ExpenseForm.module.scss'

export const ExpenseForm = (): ReactElement | null => {
  const {
    isOpen, isEditing, register, handleSubmit, onSubmit,
    errors, isSubmitting, onClose, categories,
  } = useExpenseForm()

  return isOpen ? (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditing ? EXPENSES_LABELS.FORM_EDIT_TITLE : EXPENSES_LABELS.FORM_NEW_TITLE}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>{EXPENSES_LABELS.FORM_DATE}</label>
              <input type="date" className={`${styles.input}${errors.date ? ` ${styles.error}` : ''}`} {...register('date')} />
              {errors.date && <span className={styles.errorText}>{errors.date.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{EXPENSES_LABELS.FORM_CATEGORY}</label>
              <select className={styles.input} {...register('category')}>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{EXPENSE_CATEGORY_LABELS[cat] ?? cat}</option>
                ))}
              </select>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>{EXPENSES_LABELS.FORM_AMOUNT}</label>
              <input className={`${styles.input}${errors.amount ? ` ${styles.error}` : ''}`} placeholder="₪" {...register('amount')} />
              {errors.amount && <span className={styles.errorText}>{errors.amount.message}</span>}
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>{EXPENSES_LABELS.FORM_NOTES}</label>
              <textarea className={styles.textarea} {...register('notes')} />
            </div>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{EXPENSES_LABELS.FORM_CANCEL}</button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? EXPENSES_LABELS.FORM_SAVING : EXPENSES_LABELS.FORM_SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null
}
