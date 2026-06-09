'use client'
import type { ReactElement } from 'react'
import { useUserDetailPage } from './useUserDetailPage'
import styles from './UserDetailPage.module.scss'
import type { UserDetailPageProps } from './useUserDetailPage'

export const UserDetailPage = (props: UserDetailPageProps): ReactElement => {
  const { title, backLabel, comingSoon, onBack } = useUserDetailPage(props)
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
