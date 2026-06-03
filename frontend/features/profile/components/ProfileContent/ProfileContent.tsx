'use client'

import type { ReactElement } from 'react'
import { useProfileContent } from './useProfileContent'
import { NameForm } from '../NameForm/NameForm'
import { PasswordForm } from '../PasswordForm/PasswordForm'
import styles from './ProfileContent.module.scss'

export const ProfileContent = (): ReactElement => {
  const { pageTitle, userEmail } = useProfileContent()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{pageTitle}</h1>
        {userEmail && <p className={styles.email}>{userEmail}</p>}
      </div>
      <div className={styles.sections}>
        <NameForm />
        <PasswordForm />
      </div>
    </div>
  )
}
