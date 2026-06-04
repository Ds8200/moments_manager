'use client'
import type { ReactElement } from 'react'
import { useEmailDialog } from './useEmailDialog'
import { EmojiPicker } from '@/shared/components/EmojiPicker/EmojiPicker'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import styles from './EmailDialog.module.scss'

export const EmailDialog = (): ReactElement => {
  const {
    isOpen,
    customerNameSuffix,
    emojiPickerSymbol,
    register,
    errors,
    handleSubmit,
    onSubmit,
    onClose,
    isPending,
    buttonRef,
    textareaRef,
    anchorRef,
    isPickerOpen,
    togglePicker,
    closePicker,
    onEmojiSelect,
    onBodyFocus,
    mergedBodyRef,
    bodyInputProps,
  } = useEmailDialog()

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
              {CUSTOMERS_LABELS.EMAIL_DIALOG_TITLE}{customerNameSuffix}
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
                    ref={buttonRef}
                    className={styles.emojiToggle}
                    onClick={togglePicker}
                    title={UI_LABELS.EMOJI_PICKER_BTN}
                    aria-label={UI_LABELS.EMOJI_PICKER_BTN}
                  >
                    {emojiPickerSymbol}
                  </button>
                </div>
                <div className={styles.bodyWrapper}>
                  <textarea
                    id="email-body"
                    className={styles.textarea}
                    placeholder={CUSTOMERS_LABELS.EMAIL_BODY_PLACEHOLDER}
                    rows={6}
                    ref={mergedBodyRef}
                    onFocus={onBodyFocus}
                    {...bodyInputProps}
                  />
                  <EmojiPicker
                    isOpen={isPickerOpen}
                    onClose={closePicker}
                    onSelect={onEmojiSelect}
                    triggerRef={buttonRef}
                    anchorRef={anchorRef}
                    safeRefs={[textareaRef]}
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
