'use client'
import type { ReactElement } from 'react'
import { useOrgPasswordSection } from './useOrgPasswordSection'
import styles from './OrgPasswordSection.module.scss'

export const OrgPasswordSection = (): ReactElement => {
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
  } = useOrgPasswordSection()

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="org-current-password">
            {currentPasswordLabel}
          </label>
          <input
            id="org-current-password"
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
          <label className={styles.label} htmlFor="org-new-password">
            {newPasswordLabel}
          </label>
          <input
            id="org-new-password"
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
