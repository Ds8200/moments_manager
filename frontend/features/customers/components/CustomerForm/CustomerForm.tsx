'use client'
import type { ReactElement } from 'react'
import { useCustomerForm } from './useCustomerForm'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import styles from './CustomerForm.module.scss'

export const CustomerForm = (): ReactElement | null => {
  const {
    isOpen, isEditing, register, handleSubmit, onSubmit, errors, isSubmitting, onClose,
    closeSymbol,
  } = useCustomerForm()

  return isOpen ? (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditing ? CUSTOMERS_LABELS.FORM_EDIT_TITLE : CUSTOMERS_LABELS.FORM_NEW_TITLE}</h2>
          <button className={styles.closeBtn} onClick={onClose}>{closeSymbol}</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.grid2}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>{CUSTOMERS_LABELS.FORM_NAME}</label>
              <input className={`${styles.input}${errors.name ? ` ${styles.error}` : ''}`} {...register('name')} />
              {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{CUSTOMERS_LABELS.FORM_PHONE}</label>
              <input type="tel" className={styles.input} {...register('phone')} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{CUSTOMERS_LABELS.FORM_EMAIL}</label>
              <input type="email" className={`${styles.input}${errors.email ? ` ${styles.error}` : ''}`} {...register('email')} />
              {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>{CUSTOMERS_LABELS.FORM_NOTES}</label>
              <textarea className={styles.textarea} {...register('notes')} />
            </div>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{CUSTOMERS_LABELS.FORM_CANCEL}</button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? CUSTOMERS_LABELS.FORM_SAVING : CUSTOMERS_LABELS.FORM_SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null
}
