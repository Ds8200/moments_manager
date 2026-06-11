'use client'
import type { ReactElement } from 'react'
import { useInviteStep, type InviteStepProps } from './useInviteStep'
import { ONBOARDING_LABELS } from '../../../constants/onboardingLabels'
import { ORG_ROLE } from '../../../enums/orgRoleEnums'
import styles from './InviteStep.module.scss'

export const InviteStep = (props: InviteStepProps): ReactElement => {
  const { register, handleSubmit, onSubmit, errors, isSubmitting, onSkip, onBack } =
    useInviteStep(props)

  return (
    <div className={styles.step}>
      <div className={styles.title}>{ONBOARDING_LABELS.STEP_INVITE_TITLE}</div>
      <div className={styles.subtitle}>{ONBOARDING_LABELS.STEP_INVITE_SUBTITLE}</div>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="invite-email">
            {ONBOARDING_LABELS.EMAIL_LABEL}
          </label>
          <input
            id="invite-email"
            type="email"
            placeholder={ONBOARDING_LABELS.EMAIL_PLACEHOLDER}
            className={`${styles.input}${errors.email ? ` ${styles.inputError}` : ''}`}
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="invite-role">
            {ONBOARDING_LABELS.ROLE_LABEL}
          </label>
          <select id="invite-role" className={styles.input} {...register('role')}>
            <option value={ORG_ROLE.MEMBER}>{ONBOARDING_LABELS.ROLE_MEMBER}</option>
            <option value={ORG_ROLE.ADMIN}>{ONBOARDING_LABELS.ROLE_ADMIN}</option>
          </select>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.backButton} onClick={onBack}>
            {ONBOARDING_LABELS.BACK}
          </button>
          <button type="button" className={styles.skipButton} onClick={onSkip}>
            {ONBOARDING_LABELS.SKIP}
          </button>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? ONBOARDING_LABELS.INVITING : ONBOARDING_LABELS.INVITE_BUTTON}
          </button>
        </div>
      </form>
    </div>
  )
}
