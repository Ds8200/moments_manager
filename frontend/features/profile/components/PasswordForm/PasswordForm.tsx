'use client'

import type { ReactElement } from 'react'
import { usePasswordForm } from './usePasswordForm'
import styles from './PasswordForm.module.scss'

export const PasswordForm = (): ReactElement => {
  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    sectionTitle,
    currentPasswordLabel,
    newPasswordLabel,
    saveBtnLabel,
  } = usePasswordForm()

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="current_password">{currentPasswordLabel}</label>
          <input
            id="current_password"
            type="password"
            className={`${styles.input} ${errors.current_password ? styles.inputError : ''}`}
            {...register('current_password')}
          />
          {errors.current_password && (
            <span className={styles.errorMsg}>{errors.current_password.message}</span>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="new_password">{newPasswordLabel}</label>
          <input
            id="new_password"
            type="password"
            className={`${styles.input} ${errors.new_password ? styles.inputError : ''}`}
            {...register('new_password')}
          />
          {errors.new_password && (
            <span className={styles.errorMsg}>{errors.new_password.message}</span>
          )}
        </div>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {saveBtnLabel}
        </button>
      </form>
    </section>
  )
}
