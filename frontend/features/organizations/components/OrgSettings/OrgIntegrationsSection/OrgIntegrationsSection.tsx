'use client'
import type { ReactElement } from 'react'
import { useOrgIntegrationsSection } from './useOrgIntegrationsSection'
import styles from './OrgIntegrationsSection.module.scss'

export const OrgIntegrationsSection = (): ReactElement => {
  const {
    sectionTitle,
    aiSectionTitle,
    smtpSectionTitle,
    aiKeyLabel,
    aiKeyPlaceholder,
    aiKeyConfigured,
    aiKeyNotConfigured,
    aiKeyPreviewLabel,
    smtpHostLabel,
    smtpHostPlaceholder,
    smtpPortLabel,
    smtpUsernameLabel,
    smtpUsernamePlaceholder,
    smtpPasswordLabel,
    smtpPasswordPlaceholder,
    smtpFromNameLabel,
    smtpFromNamePlaceholder,
    smtpConfigured,
    smtpNotConfigured,
    saveLabel,
    savingLabel,
    hasOpenaiKey,
    openaiKeyPreview,
    hasSmtpConfig,
    smtpHost,
    smtpPort,
    smtpUsername,
    aiRegister,
    aiHandleSubmit,
    onAiSubmit,
    isAiSubmitting,
    smtpRegister,
    smtpHandleSubmit,
    onSmtpSubmit,
    isSmtpSubmitting,
  } = useOrgIntegrationsSection()

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{sectionTitle}</h2>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{aiSectionTitle}</h3>
        <p className={`${styles.statusBadge} ${hasOpenaiKey ? styles.statusGreen : styles.statusGray}`}>
          {hasOpenaiKey ? aiKeyConfigured : aiKeyNotConfigured}
        </p>
        {hasOpenaiKey && openaiKeyPreview && (
          <p className={styles.preview}>{aiKeyPreviewLabel}: {openaiKeyPreview}</p>
        )}
        <form className={styles.form} onSubmit={aiHandleSubmit(onAiSubmit)} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="settings-openai-key">
              {aiKeyLabel}
            </label>
            <input
              id="settings-openai-key"
              type="password"
              placeholder={aiKeyPlaceholder}
              className={styles.input}
              autoComplete="off"
              {...aiRegister('openai_api_key')}
            />
          </div>
          <button type="submit" className={styles.saveBtn} disabled={isAiSubmitting}>
            {isAiSubmitting ? savingLabel : saveLabel}
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{smtpSectionTitle}</h3>
        <p className={`${styles.statusBadge} ${hasSmtpConfig ? styles.statusGreen : styles.statusGray}`}>
          {hasSmtpConfig ? smtpConfigured : smtpNotConfigured}
        </p>
        {hasSmtpConfig && smtpHost && (
          <p className={styles.preview}>{smtpHost}{smtpPort ? `:${smtpPort}` : ''}{smtpUsername ? ` · ${smtpUsername}` : ''}</p>
        )}
        <form className={styles.form} onSubmit={smtpHandleSubmit(onSmtpSubmit)} noValidate>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="settings-smtp-host">
                {smtpHostLabel}
              </label>
              <input
                id="settings-smtp-host"
                type="text"
                placeholder={smtpHostPlaceholder}
                className={styles.input}
                {...smtpRegister('smtp_host')}
              />
            </div>
            <div className={styles.fieldNarrow}>
              <label className={styles.label} htmlFor="settings-smtp-port">
                {smtpPortLabel}
              </label>
              <input
                id="settings-smtp-port"
                type="number"
                placeholder="587"
                className={styles.input}
                {...smtpRegister('smtp_port', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="settings-smtp-username">
              {smtpUsernameLabel}
            </label>
            <input
              id="settings-smtp-username"
              type="email"
              placeholder={smtpUsernamePlaceholder}
              className={styles.input}
              autoComplete="email"
              {...smtpRegister('smtp_username')}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="settings-smtp-password">
              {smtpPasswordLabel}
            </label>
            <input
              id="settings-smtp-password"
              type="password"
              placeholder={smtpPasswordPlaceholder}
              className={styles.input}
              autoComplete="off"
              {...smtpRegister('smtp_password')}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="settings-smtp-from-name">
              {smtpFromNameLabel}
            </label>
            <input
              id="settings-smtp-from-name"
              type="text"
              placeholder={smtpFromNamePlaceholder}
              className={styles.input}
              {...smtpRegister('smtp_from_name')}
            />
          </div>
          <button type="submit" className={styles.saveBtn} disabled={isSmtpSubmitting}>
            {isSmtpSubmitting ? savingLabel : saveLabel}
          </button>
        </form>
      </div>
    </section>
  )
}
