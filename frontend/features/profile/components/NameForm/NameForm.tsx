'use client'

import type { ReactElement } from 'react'
import { useNameForm } from './useNameForm'
import styles from './NameForm.module.scss'

export const NameForm = (): ReactElement => {
  const { register, handleSubmit, onSubmit, errors, isSubmitting, sectionTitle, fieldLabel, saveBtnLabel } =
    useNameForm()

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="full_name">{fieldLabel}</label>
          <input
            id="full_name"
            type="text"
            className={`${styles.input} ${errors.full_name ? styles.inputError : ''}`}
            {...register('full_name')}
          />
          {errors.full_name && (
            <span className={styles.errorMsg}>{errors.full_name.message}</span>
          )}
        </div>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {saveBtnLabel}
        </button>
      </form>
    </section>
  )
}
