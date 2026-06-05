'use client'

import type { JSX } from 'react'
import { AI_LABELS } from '@/features/ai/constants/aiLabels'
import { useAiEmailDraftCta } from './useAiEmailDraftCta'
import styles from './AiEmailDraftCta.module.scss'

export const AiEmailDraftCta = (): JSX.Element | null => {
  const { draft, handleSend } = useAiEmailDraftCta()
  if (!draft) return null
  return (
    <div className={styles.container}>
      <button type="button" className={styles.button} onClick={handleSend}>
        {draft.is_bulk ? AI_LABELS.SEND_BULK_EMAIL_CTA : AI_LABELS.SEND_EMAIL_CTA}
      </button>
    </div>
  )
}
