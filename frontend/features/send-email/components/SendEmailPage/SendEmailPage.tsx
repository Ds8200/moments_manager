'use client'
import type { MutableRefObject, ReactElement } from 'react'
import { useSendEmailPage } from './useSendEmailPage'
import { RecipientInput } from './RecipientInput/RecipientInput'
import { EmojiPicker } from '@/shared/components/EmojiPicker/EmojiPicker'
import { SEND_EMAIL_LABELS } from '../../constants/sendEmailLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'
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
    textareaRef,
    isPickerOpen,
    togglePicker,
    closePicker,
    onEmojiSelect,
  } = useSendEmailPage()

  const { ref: bodyRef, ...bodyRest } = register('body')

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
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="compose-body">
                {SEND_EMAIL_LABELS.BODY_LABEL}
              </label>
              <button
                type="button"
                className={styles.emojiToggle}
                onClick={togglePicker}
                title={UI_LABELS.EMOJI_PICKER_BTN}
                aria-label={UI_LABELS.EMOJI_PICKER_BTN}
              >
                😊
              </button>
            </div>
            <div className={styles.bodyWrapper}>
              <textarea
                id="compose-body"
                className={styles.textarea}
                placeholder={SEND_EMAIL_LABELS.BODY_PLACEHOLDER}
                rows={8}
                ref={(el) => {
                  textareaRef.current = el
                  if (typeof bodyRef === 'function') {
                    bodyRef(el)
                  } else if (bodyRef) {
                    (bodyRef as MutableRefObject<HTMLTextAreaElement | null>).current = el
                  }
                }}
                {...bodyRest}
              />
              <EmojiPicker
                isOpen={isPickerOpen}
                onClose={closePicker}
                onSelect={onEmojiSelect}
              />
            </div>
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
