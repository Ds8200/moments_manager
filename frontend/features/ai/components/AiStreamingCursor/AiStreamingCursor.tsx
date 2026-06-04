import type { ReactElement } from 'react'
import styles from './AiStreamingCursor.module.scss'

export const AiStreamingCursor = (): ReactElement => (
  <span className={styles.cursor} aria-hidden="true">|</span>
)
