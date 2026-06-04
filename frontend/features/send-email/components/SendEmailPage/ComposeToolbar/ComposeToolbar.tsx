'use client'
import type { JSX } from 'react'
import { useComposeToolbar } from './useComposeToolbar'
import type { ComposeToolbarProps } from './useComposeToolbar'
import { SEND_EMAIL_LABELS } from '../../../constants/sendEmailLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import styles from './ComposeToolbar.module.scss'

export const ComposeToolbar = (props: ComposeToolbarProps): JSX.Element => {
  const { buttonRef, togglePicker, isPickerOpen, onFileInputChange, isPending } =
    useComposeToolbar(props)

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarStart}>
        {/* File attachment — hidden input triggered by label click */}
        <label
          className={styles.iconBtn}
          title={SEND_EMAIL_LABELS.ATTACH_FILE}
          aria-label={SEND_EMAIL_LABELS.ATTACH_BTN_ARIA}
        >
          <input
            type="file"
            multiple
            className={styles.hiddenInput}
            onChange={onFileInputChange}
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </label>

        {/* Emoji picker toggle — black & white SVG smiley */}
        <button
          type="button"
          ref={buttonRef}
          className={styles.iconBtn}
          onClick={togglePicker}
          title={UI_LABELS.EMOJI_PICKER_BTN}
          aria-label={UI_LABELS.EMOJI_PICKER_BTN}
          aria-expanded={isPickerOpen}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>
      </div>

      {/* Send button */}
      <button type="submit" className={styles.sendBtn} disabled={isPending}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
        {isPending ? SEND_EMAIL_LABELS.SENDING : SEND_EMAIL_LABELS.SEND}
      </button>
    </div>
  )
}
