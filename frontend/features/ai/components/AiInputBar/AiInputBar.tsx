import type { ReactElement } from 'react'
import { AI_LABELS } from '@/features/ai/constants/aiLabels'
import { useAiInputBar } from './useAiInputBar'
import styles from './AiInputBar.module.scss'

export const AiInputBar = (): ReactElement => {
  const { value, onChange, onKeyDown, onSend, onRetry, isDisabled, error } = useAiInputBar()

  return (
    <div className={styles.wrapper}>
      {error && (
        <div className={styles.errorStrip}>
          <span>{error}</span>
          <button type="button" className={styles.retryButton} onClick={onRetry}>
            {AI_LABELS.ERROR_RETRY}
          </button>
        </div>
      )}
      <div className={styles.inputRow}>
        <textarea
          className={styles.textarea}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={AI_LABELS.INPUT_PLACEHOLDER}
          rows={1}
          aria-label={AI_LABELS.INPUT_PLACEHOLDER}
        />
        <button
          type="button"
          className={styles.sendButton}
          onClick={onSend}
          disabled={isDisabled}
          aria-label={AI_LABELS.SEND_BUTTON_ARIA}
        >
          {AI_LABELS.SEND_BUTTON}
        </button>
      </div>
    </div>
  )
}
