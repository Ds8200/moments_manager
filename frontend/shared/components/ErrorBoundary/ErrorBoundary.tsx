'use client'
import type { ReactElement } from 'react'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import styles from './ErrorBoundary.module.scss'

export interface ErrorBoundaryProps {
  message?: string
  title?: string
  onReset: () => void
}

export const ErrorBoundary = ({
  message,
  title,
  onReset,
}: ErrorBoundaryProps): ReactElement => {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{title ?? UI_LABELS.ERROR_TITLE}</h2>
      {message && <p className={styles.message}>{message}</p>}
      <button type="button" className={styles.button} onClick={onReset}>
        {UI_LABELS.TRY_AGAIN}
      </button>
    </div>
  )
}
