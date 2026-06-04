'use client'
import type { JSX } from 'react'
import { useSendEmailPage } from './useSendEmailPage'
import { RecipientInput } from './RecipientInput/RecipientInput'
import { AttachmentChips } from '@/shared/components/AttachmentChips/AttachmentChips'
import { ComposeToolbar } from '@/shared/components/ComposeToolbar/ComposeToolbar'
import { EmojiPicker } from '@/shared/components/EmojiPicker/EmojiPicker'
import { SEND_EMAIL_LABELS } from '../../constants/sendEmailLabels'
import styles from './SendEmailPage.module.scss'

export const SendEmailPage = (): JSX.Element => {
  const {
    recipients, onToggleRecipient, onSelectAllRecipients, onClearAllRecipients,
    onAddManualRecipient, onRemoveRecipient,
    errors, handleSubmit, recipientsError,
    onSubmit, isPending,
    subjectRef, textareaRef, buttonRef, anchorRef,
    isPickerOpen, togglePicker, closePicker, onEmojiSelect,
    onSubjectFocus, onBodyFocus,
    mergedSubjectRef, subjectRest,
    mergedBodyRef, bodyRest,
    files, removeFile, onFileInputChange, fileError,
    isDragOver, onDragOver, onDragLeave, onDrop,
  } = useSendEmailPage()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{SEND_EMAIL_LABELS.PAGE_TITLE}</h1>

      <div
        className={`${styles.card}${isDragOver ? ` ${styles.cardDragOver}` : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.fieldRow}>
            <RecipientInput
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
            <label className={styles.fieldLabel} htmlFor="compose-subject">{SEND_EMAIL_LABELS.SUBJECT_LABEL}</label>
            <input id="compose-subject" className={styles.input} placeholder={SEND_EMAIL_LABELS.SUBJECT_PLACEHOLDER} ref={mergedSubjectRef} onFocus={onSubjectFocus} {...subjectRest} />
            {errors.subject && <span className={styles.error}>{errors.subject.message}</span>}
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel} htmlFor="compose-body">{SEND_EMAIL_LABELS.BODY_LABEL}</label>
            <div className={styles.bodyWrapper}>
              <textarea id="compose-body" className={styles.textarea} placeholder={SEND_EMAIL_LABELS.BODY_PLACEHOLDER} rows={9} onFocus={onBodyFocus} ref={mergedBodyRef} {...bodyRest} />
              {isDragOver && (
                <div className={styles.dragOverlay}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  <span>{SEND_EMAIL_LABELS.DRAG_DROP_HINT}</span>
                </div>
              )}
            </div>
            {errors.body && <span className={styles.error}>{errors.body.message}</span>}
          </div>

          {files.length > 0 && (
            <div className={styles.attachmentRow}>
              <AttachmentChips files={files} onRemove={removeFile} />
              {fileError && <span className={styles.error}>{fileError}</span>}
            </div>
          )}

          <ComposeToolbar buttonRef={buttonRef} togglePicker={togglePicker} isPickerOpen={isPickerOpen} onFileInputChange={onFileInputChange} isPending={isPending} />
        </form>

        <EmojiPicker isOpen={isPickerOpen} onClose={closePicker} onSelect={onEmojiSelect} triggerRef={buttonRef} anchorRef={anchorRef} safeRefs={[subjectRef, textareaRef]} />
      </div>
    </div>
  )
}
