'use client'
import type { JSX, MutableRefObject } from 'react'
import { useEmailDialog } from './useEmailDialog'
import { EmojiPicker } from '@/shared/components/EmojiPicker/EmojiPicker'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import styles from './EmailDialog.module.scss'

export const EmailDialog = (): JSX.Element => {
  const {
    isOpen,
    customerName,
    register,
    errors,
    handleSubmit,
    onSubmit,
    onClose,
    isPending,
    textareaRef,
    isPickerOpen,
    togglePicker,
    closePicker,
    onEmojiSelect,
  } = useEmailDialog()

  const { ref: bodyRef, ...bodyRest } = register('body')

  return (
    <>
      {isOpen && (
        <div className={styles.backdrop} onClick={onClose}>
          <div
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className={styles.title}>
              {CUSTOMERS_LABELS.EMAIL_DIALOG_TITLE}
              {customerName ? ` — ${customerName}` : ''}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email-subject">
                  {CUSTOMERS_LABELS.EMAIL_SUBJECT_LABEL}
                </label>
                <input
                  id="email-subject"
                  className={styles.input}
                  placeholder={CUSTOMERS_LABELS.EMAIL_SUBJECT_PLACEHOLDER}
                  {...register('subject')}
                />
                {errors.subject && (
                  <span className={styles.error}>{errors.subject.message}</span>
                )}
              </div>
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="email-body">
                    {CUSTOMERS_LABELS.EMAIL_BODY_LABEL}
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
                    id="email-body"
                    className={styles.textarea}
                    placeholder={CUSTOMERS_LABELS.EMAIL_BODY_PLACEHOLDER}
                    rows={6}
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
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={onClose}
                  disabled={isPending}
                >
                  {CUSTOMERS_LABELS.EMAIL_CANCEL}
                </button>
                <button type="submit" className={styles.sendButton} disabled={isPending}>
                  {isPending ? CUSTOMERS_LABELS.EMAIL_SENDING : CUSTOMERS_LABELS.EMAIL_SEND}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
