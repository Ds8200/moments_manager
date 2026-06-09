'use client'
import type { ReactElement } from 'react'
import { useExpenseDetailPage } from './useExpenseDetailPage'
import styles from './ExpenseDetailPage.module.scss'
import type { ExpenseDetailPageProps } from './useExpenseDetailPage'

export const ExpenseDetailPage = (props: ExpenseDetailPageProps): ReactElement => {
  const { title, backLabel, comingSoon, onBack } = useExpenseDetailPage(props)
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <button className={styles.backBtn} onClick={onBack}>{backLabel}</button>
      </div>
      <p className={styles.placeholder}>{comingSoon}</p>
    </div>
  )
}
