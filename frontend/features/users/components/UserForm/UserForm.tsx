'use client'
import type { ReactElement } from 'react'
import { useUserForm } from './useUserForm'
import { USERS_LABELS, USER_ROLE_VALUES } from '../../constants/usersLabels'
import styles from './UserForm.module.scss'

export const UserForm = (): ReactElement | null => {
  const { isOpen, register, handleSubmit, onSubmit, errors, isSubmitting, onClose } = useUserForm()

  return isOpen ? (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{USERS_LABELS.FORM_NEW_TITLE}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label}>{USERS_LABELS.FORM_FULL_NAME}</label>
              <input
                className={`${styles.input}${errors.full_name ? ` ${styles.error}` : ''}`}
                {...register('full_name')}
              />
              {errors.full_name && (
                <span className={styles.errorText}>{errors.full_name.message}</span>
              )}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{USERS_LABELS.FORM_EMAIL}</label>
              <input
                type="email"
                className={`${styles.input}${errors.email ? ` ${styles.error}` : ''}`}
                {...register('email')}
              />
              {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{USERS_LABELS.FORM_ROLE}</label>
              <select className={styles.input} {...register('role')}>
                <option value={USER_ROLE_VALUES.USER}>{USERS_LABELS.ROLE_USER}</option>
                <option value={USER_ROLE_VALUES.ADMIN}>{USERS_LABELS.ROLE_ADMIN}</option>
              </select>
            </div>
            <p className={styles.note}>{USERS_LABELS.WELCOME_EMAIL_NOTE}</p>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {USERS_LABELS.FORM_CANCEL}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? USERS_LABELS.FORM_SAVING : USERS_LABELS.FORM_SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null
}
