'use client'

import type { ReactElement } from 'react'
import { useOrgNameForm } from './useOrgNameForm'
import styles from './OrgNameForm.module.scss'

export const OrgNameForm = (): ReactElement => {
  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    sectionTitle,
    fieldLabel,
    saveBtnLabel,
    savingBtnLabel,
  } = useOrgNameForm()

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="org_name">
            {fieldLabel}
          </label>
          <input
            id="org_name"
            type="text"
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            {...register('name')}
          />
          {errors.name && <span className={styles.errorMsg}>{errors.name.message}</span>}
        </div>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? savingBtnLabel : saveBtnLabel}
        </button>
      </form>
    </section>
  )
}
