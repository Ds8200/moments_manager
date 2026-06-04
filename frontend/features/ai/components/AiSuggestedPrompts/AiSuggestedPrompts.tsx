import type { ReactElement } from 'react'
import { AI_LABELS } from '@/features/ai/constants/aiLabels'
import { useAiSuggestedPrompts } from './useAiSuggestedPrompts'
import styles from './AiSuggestedPrompts.module.scss'

export interface AiSuggestedPromptsProps {
  onSelect: (prompt: string) => void
}

export const AiSuggestedPrompts = ({ onSelect }: AiSuggestedPromptsProps): ReactElement => {
  const { prompts, handleSelect } = useAiSuggestedPrompts(onSelect)

  return (
    <div className={styles.container}>
      <p className={styles.title}>{AI_LABELS.EMPTY_STATE_TITLE}</p>
      <p className={styles.subtitle}>{AI_LABELS.EMPTY_STATE_SUBTITLE}</p>
      <div className={styles.chips}>
        {prompts.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.chip}
            onClick={() => handleSelect(p.prompt)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
