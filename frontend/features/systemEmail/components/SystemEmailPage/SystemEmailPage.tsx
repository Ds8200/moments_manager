'use client'
import type { JSX } from 'react'
import { useSystemEmailPage } from './useSystemEmailPage'
import { OrgOwnerRecipientInput } from './OrgOwnerRecipientInput/OrgOwnerRecipientInput'
import styles from './SystemEmailPage.module.scss'

export const SystemEmailPage = (): JSX.Element => {
  const {
    pageTitle,
    recipients,
    recipientsError,
    onToggleRecipient,
    onSelectAllRecipients,
    onClearAllRecipients,
    onAddManualRecipient,
    onRemoveRecipient,
    register,
    errors,
    handleSubmit,
    onSubmit,
    isPending,
    subjectLabel,
    subjectPlaceholder,
    bodyLabel,
    bodyPlaceholder,
    sendLabel,
    sendingLabel,
  } = useSystemEmailPage()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{pageTitle}</h1>

      <div className={styles.card}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.fieldRow}>
            <OrgOwnerRecipientInput
              recipients={recipients}
              onToggle={onToggleRecipient}
              onSelectAll={onSelectAllRecipients}
              onClearAll={onClearAllRecipients}
              onAddManual={onAddManualRecipient}
              onRemoveRecipient={onRemoveRecipient}
              error={recipientsError}
            />
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel} htmlFor="admin-subject">{subjectLabel}</label>
            <input
              id="admin-subject"
              className={styles.input}
              placeholder={subjectPlaceholder}
              {...register('subject')}
            />
            {errors.subject && <span className={styles.error}>{errors.subject.message}</span>}
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel} htmlFor="admin-body">{bodyLabel}</label>
            <textarea
              id="admin-body"
              className={styles.textarea}
              placeholder={bodyPlaceholder}
              rows={9}
              {...register('body')}
            />
            {errors.body && <span className={styles.error}>{errors.body.message}</span>}
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.sendBtn} disabled={isPending}>
              {isPending ? sendingLabel : sendLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
