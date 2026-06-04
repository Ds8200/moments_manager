import type { ReactElement } from 'react'
import { useAiStreamingCursor } from './useAiStreamingCursor'
import styles from './AiStreamingCursor.module.scss'

export const AiStreamingCursor = (): ReactElement => {
  const { toolLabel } = useAiStreamingCursor()
  return toolLabel ? (
    <span className={styles.toolLabel} aria-live="polite">{toolLabel}...</span>
  ) : (
    <span className={styles.cursor} aria-hidden="true">|</span>
  )
}
