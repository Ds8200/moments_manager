'use client'
import type { ReactElement } from 'react'
import { useIntegrationsStep, type IntegrationsStepProps } from './useIntegrationsStep'
import { ONBOARDING_LABELS } from '../../../constants/onboardingLabels'
import styles from './IntegrationsStep.module.scss'

export const IntegrationsStep = (props: IntegrationsStepProps): ReactElement => {
  const {
    register,
    handleSubmit,
    onSubmit,
    isSubmitting,
    onSkip,
    onBack,
    hasOpenaiKey,
    openaiKeyPreview,
    hasSmtpConfig,
  } = useIntegrationsStep(props)

  return (
    <div className={styles.step}>
      <div className={styles.title}>{ONBOARDING_LABELS.STEP_INTEGRATIONS_TITLE}</div>
      <div className={styles.subtitle}>{ONBOARDING_LABELS.STEP_INTEGRATIONS_SUBTITLE}</div>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>{ONBOARDING_LABELS.AI_SECTION_TITLE}</h3>
          <p className={styles.statusBadge}>
            {hasOpenaiKey
              ? `${ONBOARDING_LABELS.AI_KEY_CONFIGURED} (${openaiKeyPreview})`
              : ONBOARDING_LABELS.AI_KEY_NOT_CONFIGURED}
          </p>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="openai_api_key">
              {ONBOARDING_LABELS.AI_KEY_LABEL}
            </label>
            <input
              id="openai_api_key"
              type="password"
              placeholder={ONBOARDING_LABELS.AI_KEY_PLACEHOLDER}
              className={styles.input}
              autoComplete="off"
              {...register('openai_api_key')}
            />
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>{ONBOARDING_LABELS.SMTP_SECTION_TITLE}</h3>
          <p className={styles.statusBadge}>
            {hasSmtpConfig
              ? ONBOARDING_LABELS.SMTP_CONFIGURED
              : ONBOARDING_LABELS.SMTP_NOT_CONFIGURED}
          </p>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="smtp_host">
                {ONBOARDING_LABELS.SMTP_HOST_LABEL}
              </label>
              <input
                id="smtp_host"
                type="text"
                placeholder={ONBOARDING_LABELS.SMTP_HOST_PLACEHOLDER}
                className={styles.input}
                {...register('smtp_host')}
              />
            </div>
            <div className={styles.fieldNarrow}>
              <label className={styles.label} htmlFor="smtp_port">
                {ONBOARDING_LABELS.SMTP_PORT_LABEL}
              </label>
              <input
                id="smtp_port"
                type="number"
                placeholder="587"
                className={styles.input}
                {...register('smtp_port', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="smtp_username">
              {ONBOARDING_LABELS.SMTP_USERNAME_LABEL}
            </label>
            <input
              id="smtp_username"
              type="email"
              placeholder={ONBOARDING_LABELS.SMTP_USERNAME_PLACEHOLDER}
              className={styles.input}
              autoComplete="email"
              {...register('smtp_username')}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="smtp_password">
              {ONBOARDING_LABELS.SMTP_PASSWORD_LABEL}
            </label>
            <input
              id="smtp_password"
              type="password"
              placeholder={ONBOARDING_LABELS.SMTP_PASSWORD_PLACEHOLDER}
              className={styles.input}
              autoComplete="off"
              {...register('smtp_password')}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="smtp_from_name">
              {ONBOARDING_LABELS.SMTP_FROM_NAME_LABEL}
            </label>
            <input
              id="smtp_from_name"
              type="text"
              placeholder={ONBOARDING_LABELS.SMTP_FROM_NAME_PLACEHOLDER}
              className={styles.input}
              {...register('smtp_from_name')}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.backButton} onClick={onBack}>
            {ONBOARDING_LABELS.BACK}
          </button>
          <button type="button" className={styles.skipButton} onClick={onSkip}>
            {ONBOARDING_LABELS.SKIP}
          </button>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {ONBOARDING_LABELS.NEXT}
          </button>
        </div>
      </form>
    </div>
  )
}
