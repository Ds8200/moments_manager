'use client'
import type { ReactElement } from 'react'
import { useSysAdminPasswordSection } from './useSysAdminPasswordSection'
import styles from './SysAdminPasswordSection.module.scss'

export const SysAdminPasswordSection = (): ReactElement => {
  const {
    sectionTitle,
    currentPasswordLabel,
    newPasswordLabel,
    saveLabel,
    savingLabel,
    currentPasswordError,
    newPasswordError,
    register,
    handleSubmit,
    onSubmit,
    isSubmitting,
  } = useSysAdminPasswordSection()

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>{sectionTitle}</h3>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sys-current-password">
            {currentPasswordLabel}
          </label>
          <input
            id="sys-current-password"
            type="password"
            className={`${styles.input}${currentPasswordError ? ` ${styles.inputError}` : ''}`}
            autoComplete="current-password"
            {...register('current_password')}
          />
          {currentPasswordError && (
            <span className={styles.errorMsg}>{currentPasswordError}</span>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sys-new-password">
            {newPasswordLabel}
          </label>
          <input
            id="sys-new-password"
            type="password"
            className={`${styles.input}${newPasswordError ? ` ${styles.inputError}` : ''}`}
            autoComplete="new-password"
            {...register('new_password')}
          />
          {newPasswordError && (
            <span className={styles.errorMsg}>{newPasswordError}</span>
          )}
        </div>
        <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
          {isSubmitting ? savingLabel : saveLabel}
        </button>
      </form>
    </section>
  )
}
