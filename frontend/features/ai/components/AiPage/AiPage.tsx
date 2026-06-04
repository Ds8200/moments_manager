'use client'

import type { ReactElement } from 'react'
import { AI_LABELS } from '@/features/ai/constants/aiLabels'
import { AiInputBar } from '../AiInputBar/AiInputBar'
import { AiMessageList } from '../AiMessageList/AiMessageList'
import { useAiPage } from './useAiPage'
import styles from './AiPage.module.scss'

export const AiPage = (): ReactElement => {
  const { handleClear, handleSuggestedPrompt, isStreaming } = useAiPage()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{AI_LABELS.PAGE_TITLE}</h1>
          <p className={styles.subtitle}>{AI_LABELS.PAGE_SUBTITLE}</p>
        </div>
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          disabled={isStreaming}
        >
          {AI_LABELS.CLEAR_BUTTON}
        </button>
      </div>
      <AiMessageList onSuggestedPrompt={handleSuggestedPrompt} />
      <AiInputBar />
    </div>
  )
}
