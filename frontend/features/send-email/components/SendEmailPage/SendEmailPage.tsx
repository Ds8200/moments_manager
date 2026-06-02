'use client'
import type { ReactElement } from 'react'
import { useSendEmailPage } from './useSendEmailPage'
import { RecipientInput } from './RecipientInput/RecipientInput'
import { SEND_EMAIL_LABELS } from '../../constants/sendEmailLabels'
import styles from './SendEmailPage.module.scss'

export const SendEmailPage = (): ReactElement => {
  const {
    recipients,
    onAddRecipient,
    onRemoveRecipient,
    register,
    errors,
    handleSubmit,
    recipientsError,
    onSubmit,
    isPending,
  } = useSendEmailPage()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{SEND_EMAIL_LABELS.PAGE_TITLE}</h1>

      <div className={styles.card}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.field}>
            <RecipientInput
              recipients={recipients}
              onAdd={onAddRecipient}
              onRemove={onRemoveRecipient}
              error={recipientsError}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="compose-subject">
              {SEND_EMAIL_LABELS.SUBJECT_LABEL}
            </label>
            <input
              id="compose-subject"
              className={styles.input}
              placeholder={SEND_EMAIL_LABELS.SUBJECT_PLACEHOLDER}
              {...register('subject')}
            />
            {errors.subject && (
              <span className={styles.error}>{errors.subject.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="compose-body">
              {SEND_EMAIL_LABELS.BODY_LABEL}
            </label>
            <textarea
              id="compose-body"
              className={styles.textarea}
              placeholder={SEND_EMAIL_LABELS.BODY_PLACEHOLDER}
              rows={8}
              {...register('body')}
            />
            {errors.body && <span className={styles.error}>{errors.body.message}</span>}
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.sendButton} disabled={isPending}>
              {isPending ? SEND_EMAIL_LABELS.SENDING : SEND_EMAIL_LABELS.SEND}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
