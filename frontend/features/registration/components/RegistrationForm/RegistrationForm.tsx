'use client'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { useRegistrationForm } from './useRegistrationForm'
import { REGISTRATION_LABELS } from '../../constants/registrationLabels'
import { ROUTES } from '@/shared/constants/routes'
import styles from './RegistrationForm.module.scss'

export const RegistrationForm = (): ReactElement => {
  const { register, handleSubmit, onSubmit, errors, submitError, slugPreview, isSubmitting } =
    useRegistrationForm()

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.title}>{REGISTRATION_LABELS.TITLE}</div>
        <div className={styles.subtitle}>{REGISTRATION_LABELS.SUBTITLE}</div>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="business_name">
              {REGISTRATION_LABELS.BUSINESS_NAME_LABEL}
            </label>
            <input
              id="business_name"
              type="text"
              placeholder={REGISTRATION_LABELS.BUSINESS_NAME_PLACEHOLDER}
              className={`${styles.input}${errors.business_name ? ` ${styles.inputError}` : ''}`}
              autoComplete="organization"
              {...register('business_name')}
            />
            {errors.business_name && (
              <span className={styles.errorText}>{errors.business_name.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="slug">
              {REGISTRATION_LABELS.SLUG_LABEL}
            </label>
            <input
              id="slug"
              type="text"
              placeholder={REGISTRATION_LABELS.SLUG_PLACEHOLDER}
              className={`${styles.input}${errors.slug ? ` ${styles.inputError}` : ''}`}
              autoComplete="off"
              {...register('slug')}
            />
            <span className={styles.hint}>{slugPreview}</span>
            {errors.slug && <span className={styles.errorText}>{errors.slug.message}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="owner_email">
              {REGISTRATION_LABELS.EMAIL_LABEL}
            </label>
            <input
              id="owner_email"
              type="email"
              placeholder={REGISTRATION_LABELS.EMAIL_PLACEHOLDER}
              className={`${styles.input}${errors.owner_email ? ` ${styles.inputError}` : ''}`}
              autoComplete="email"
              {...register('owner_email')}
            />
            {errors.owner_email && (
              <span className={styles.errorText}>{errors.owner_email.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              {REGISTRATION_LABELS.PASSWORD_LABEL}
            </label>
            <input
              id="password"
              type="password"
              placeholder={REGISTRATION_LABELS.PASSWORD_PLACEHOLDER}
              className={`${styles.input}${errors.password ? ` ${styles.inputError}` : ''}`}
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password && (
              <span className={styles.errorText}>{errors.password.message}</span>
            )}
          </div>

          {submitError && <div className={styles.submitError}>{submitError}</div>}

          <button type="submit" className={styles.button} disabled={isSubmitting}>
            {isSubmitting ? REGISTRATION_LABELS.SUBMITTING : REGISTRATION_LABELS.SUBMIT}
          </button>

          <div className={styles.loginPrompt}>
            <span>{REGISTRATION_LABELS.LOGIN_PROMPT}</span>
            <Link href={ROUTES.LOGIN} className={styles.loginLink}>
              {REGISTRATION_LABELS.LOGIN_LINK}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
