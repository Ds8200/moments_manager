'use client'
import type { ReactElement } from 'react'
import { useSuperAdminUserDetailPage } from './useSuperAdminUserDetailPage'
import styles from './SuperAdminUserDetailPage.module.scss'
import type { SuperAdminUserDetailPageProps } from './useSuperAdminUserDetailPage'

export const SuperAdminUserDetailPage = (props: SuperAdminUserDetailPageProps): ReactElement => {
  const { title, backLabel, comingSoon, onBack } = useSuperAdminUserDetailPage(props)
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
