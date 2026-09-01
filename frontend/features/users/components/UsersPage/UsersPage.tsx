'use client'
import type { ReactElement } from 'react'
import { useUsersPage } from './useUsersPage'
import { PageLayout } from '@/shared/components/PageLayout/PageLayout'
import { UsersTable } from '../UsersTable/UsersTable'
import { UserForm } from '../UserForm/UserForm'
import { USERS_LABELS } from '../../constants/usersLabels'
import styles from './UsersPage.module.scss'

export const UsersPage = (): ReactElement => {
  const { onAddUser } = useUsersPage()

  return (
    <>
      <PageLayout
        title={USERS_LABELS.PAGE_TITLE}
        actionLabel={USERS_LABELS.NEW_USER}
        onAction={onAddUser}
      >
        <div className={styles.card}>
          <UsersTable />
        </div>
      </PageLayout>

      <UserForm />
    </>
  )
}
