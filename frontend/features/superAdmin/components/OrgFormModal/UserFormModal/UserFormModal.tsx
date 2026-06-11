'use client'
import type { ReactElement } from 'react'
import { useUserFormModal } from './useUserFormModal'
import { SUPER_ADMIN_LABELS } from '../../../constants/superAdminLabels'
import styles from './UserFormModal.module.scss'

export const UserFormModal = (): ReactElement | null => {
  const { isOpen, onClose, closeSymbol, register, errors, isSubmitting, onSubmit } = useUserFormModal()

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{SUPER_ADMIN_LABELS.MODAL_CREATE_USER_TITLE}</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>{closeSymbol}</button>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label}>{SUPER_ADMIN_LABELS.FIELD_USER_EMAIL}</label>
              <input
                type="email"
                className={`${styles.input}${errors.email ? ` ${styles.inputError}` : ''}`}
                {...register('email')}
              />
              {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{SUPER_ADMIN_LABELS.FIELD_USER_FULL_NAME}</label>
              <input
                className={`${styles.input}${errors.full_name ? ` ${styles.inputError}` : ''}`}
                {...register('full_name')}
              />
              {errors.full_name && <span className={styles.errorText}>{errors.full_name.message}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{SUPER_ADMIN_LABELS.FIELD_USER_PHONE}</label>
              <input className={styles.input} {...register('phone')} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{SUPER_ADMIN_LABELS.FIELD_USER_PASSWORD}</label>
              <input
                type="password"
                className={`${styles.input}${errors.password ? ` ${styles.inputError}` : ''}`}
                {...register('password')}
              />
              {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {SUPER_ADMIN_LABELS.CANCEL}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {SUPER_ADMIN_LABELS.SUBMIT_CREATE_USER}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
