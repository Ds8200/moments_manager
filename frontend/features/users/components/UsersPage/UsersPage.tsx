'use client'
import type { ReactElement } from 'react'
import { useUsersPage } from './useUsersPage'
import { UsersTable } from '../UsersTable/UsersTable'
import { UserForm } from '../UserForm/UserForm'
import { USERS_LABELS } from '../../constants/usersLabels'
import styles from './UsersPage.module.scss'

export const UsersPage = (): ReactElement => {
  const { onAddUser } = useUsersPage()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{USERS_LABELS.PAGE_TITLE}</h1>
        <button className={styles.newBtn} onClick={onAddUser}>
          {USERS_LABELS.NEW_USER}
        </button>
      </div>

      <div className={styles.card}>
        <UsersTable />
      </div>

      <UserForm />
    </div>
  )
}
