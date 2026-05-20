'use client'
import { useLoginForm } from './useLoginForm'
import { AUTH_LABELS } from '../../constants/authLabels'
import styles from './LoginForm.module.scss'

export function LoginForm() {
  const { register, handleSubmit, onSubmit, errors, submitError, isSubmitting } = useLoginForm()

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.logo}>{AUTH_LABELS.TITLE}</div>
        <div className={styles.subtitle}>{AUTH_LABELS.SUBTITLE}</div>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              {AUTH_LABELS.EMAIL_LABEL}
            </label>
            <input
              id="email"
              type="email"
              placeholder={AUTH_LABELS.EMAIL_PLACEHOLDER}
              className={`${styles.input}${errors.email ? ` ${styles.inputError}` : ''}`}
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              {AUTH_LABELS.PASSWORD_LABEL}
            </label>
            <input
              id="password"
              type="password"
              placeholder={AUTH_LABELS.PASSWORD_PLACEHOLDER}
              className={`${styles.input}${errors.password ? ` ${styles.inputError}` : ''}`}
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
          </div>

          {submitError && <div className={styles.submitError}>{submitError}</div>}

          <button type="submit" className={styles.button} disabled={isSubmitting}>
            {isSubmitting ? AUTH_LABELS.SUBMITTING : AUTH_LABELS.SUBMIT}
          </button>
        </form>
      </div>
    </div>
  )
}
