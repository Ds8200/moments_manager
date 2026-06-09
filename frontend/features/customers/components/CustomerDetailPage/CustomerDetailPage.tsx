'use client'
import type { ReactElement } from 'react'
import { useCustomerDetailPage } from './useCustomerDetailPage'
import styles from './CustomerDetailPage.module.scss'
import type { CustomerDetailPageProps } from './useCustomerDetailPage'

export const CustomerDetailPage = (props: CustomerDetailPageProps): ReactElement => {
  const { title, backLabel, comingSoon, onBack } = useCustomerDetailPage(props)
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
