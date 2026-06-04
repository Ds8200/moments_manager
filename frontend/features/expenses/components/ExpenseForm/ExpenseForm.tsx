'use client'
import type { ReactElement } from 'react'
import { useExpenseForm } from './useExpenseForm'
import { CategoryManagerModal } from '@/shared/components/CategoryManagerModal/CategoryManagerModal'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import styles from './ExpenseForm.module.scss'

export const ExpenseForm = (): ReactElement | null => {
  const {
    isOpen, isEditing, register, handleSubmit, onSubmit,
    errors, isSubmitting, onClose, categories,
    isCategoryManagerOpen, openCategoryManager,
    categoryManagerOptions, closeSymbol, currencySymbol,
  } = useExpenseForm()

  return isOpen ? (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditing ? EXPENSES_LABELS.FORM_EDIT_TITLE : EXPENSES_LABELS.FORM_NEW_TITLE}</h2>
          <button className={styles.closeBtn} onClick={onClose}>{closeSymbol}</button>
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
              <div className={styles.categoryRow}>
                <select className={styles.input} {...register('category_id')}>
                  <option value="">{EXPENSES_LABELS.FORM_CATEGORY_PLACEHOLDER}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button type="button" className={styles.manageBtn} onClick={openCategoryManager}>
                  {EXPENSES_LABELS.FORM_MANAGE_CATEGORIES}
                </button>
              </div>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>{EXPENSES_LABELS.FORM_AMOUNT}</label>
              <input className={`${styles.input}${errors.amount ? ` ${styles.error}` : ''}`} placeholder={currencySymbol} {...register('amount')} />
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
        {isCategoryManagerOpen && <CategoryManagerModal {...categoryManagerOptions} />}
      </div>
    </div>
  ) : null
}
