'use client'
import type { ReactElement } from 'react'
import { useSystemOpenAISection } from './useSystemOpenAISection'
import styles from './SystemOpenAISection.module.scss'

export const SystemOpenAISection = (): ReactElement => {
  const {
    sectionTitle,
    keyLabel,
    keyPlaceholder,
    configuredLabel,
    notConfiguredLabel,
    keyPreviewLabel,
    saveLabel,
    savingLabel,
    hasOpenaiKey,
    openaiKeyPreview,
    register,
    handleSubmit,
    onSubmit,
    isSubmitting,
  } = useSystemOpenAISection()

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>{sectionTitle}</h3>
        <span className={`${styles.statusBadge} ${hasOpenaiKey ? styles.statusGreen : styles.statusGray}`}>
          {hasOpenaiKey ? configuredLabel : notConfiguredLabel}
        </span>
      </div>
      {hasOpenaiKey && openaiKeyPreview && (
        <p className={styles.preview}>{keyPreviewLabel}: {openaiKeyPreview}</p>
      )}
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sys-openai-key">
            {keyLabel}
          </label>
          <input
            id="sys-openai-key"
            type="password"
            placeholder={keyPlaceholder}
            className={styles.input}
            autoComplete="off"
            {...register('platform_openai_api_key')}
          />
        </div>
        <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
          {isSubmitting ? savingLabel : saveLabel}
        </button>
      </form>
    </section>
  )
}
