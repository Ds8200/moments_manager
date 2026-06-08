'use client'
import type { ReactElement } from 'react'
import { Autocomplete } from '@/shared/components/Autocomplete/Autocomplete'
import { useSystemSmtpSection } from './useSystemSmtpSection'
import styles from './SystemSmtpSection.module.scss'

export const SystemSmtpSection = (): ReactElement => {
  const {
    sectionTitle,
    hostLabel,
    hostPlaceholder,
    portLabel,
    usernameLabel,
    usernamePlaceholder,
    passwordLabel,
    passwordPlaceholder,
    fromNameLabel,
    fromNamePlaceholder,
    configuredLabel,
    notConfiguredLabel,
    saveLabel,
    savingLabel,
    hasSmtpConfig,
    smtpHost,
    smtpPort,
    smtpUsername,
    hostValue,
    hostOptions,
    onHostChange,
    onHostSearch,
    onHostFreeText,
    register,
    handleSubmit,
    onSubmit,
    isSubmitting,
  } = useSystemSmtpSection()

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>{sectionTitle}</h3>
        <span className={`${styles.statusBadge} ${hasSmtpConfig ? styles.statusGreen : styles.statusGray}`}>
          {hasSmtpConfig ? configuredLabel : notConfiguredLabel}
        </span>
      </div>
      {hasSmtpConfig && smtpHost && (
        <p className={styles.preview}>
          {smtpHost}{smtpPort ? `:${smtpPort}` : ''}{smtpUsername ? ` · ${smtpUsername}` : ''}
        </p>
      )}
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.row}>
          <div className={styles.field}>
            <Autocomplete
              id="sys-smtp-host"
              label={hostLabel}
              placeholder={hostPlaceholder}
              value={hostValue}
              onChange={onHostChange}
              options={hostOptions}
              onSearch={onHostSearch}
              onFreeText={onHostFreeText}
              defaultLabel={hostValue ?? undefined}
            />
          </div>
          <div className={styles.fieldNarrow}>
            <label className={styles.label} htmlFor="sys-smtp-port">
              {portLabel}
            </label>
            <input
              id="sys-smtp-port"
              type="number"
              placeholder="587"
              className={styles.input}
              {...register('platform_smtp_port', { valueAsNumber: true })}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sys-smtp-username">
            {usernameLabel}
          </label>
          <input
            id="sys-smtp-username"
            type="email"
            placeholder={usernamePlaceholder}
            className={styles.input}
            autoComplete="email"
            {...register('platform_smtp_username')}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sys-smtp-password">
            {passwordLabel}
          </label>
          <input
            id="sys-smtp-password"
            type="password"
            placeholder={passwordPlaceholder}
            className={styles.input}
            autoComplete="off"
            {...register('platform_smtp_password')}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sys-smtp-from-name">
            {fromNameLabel}
          </label>
          <input
            id="sys-smtp-from-name"
            type="text"
            placeholder={fromNamePlaceholder}
            className={styles.input}
            {...register('platform_smtp_from_name')}
          />
        </div>
        <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
          {isSubmitting ? savingLabel : saveLabel}
        </button>
      </form>
    </section>
  )
}
