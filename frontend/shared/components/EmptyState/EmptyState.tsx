import type { ReactElement } from 'react'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import styles from './EmptyState.module.scss'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export const EmptyState = ({ icon = UI_SYMBOLS.EMPTY_MAILBOX, title, description, action }: EmptyStateProps): ReactElement => {
  return (
    <div className={styles.wrapper}>
      <span className={styles.icon}>{icon}</span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
