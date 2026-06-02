'use client'
import type { ReactElement } from 'react'
import { useUsersTable } from './useUsersTable'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { USERS_LABELS, USER_ROLE_VALUES } from '../../constants/usersLabels'
import styles from './UsersTable.module.scss'
import type { User } from '../../types'

const HEADERS = [
  USERS_LABELS.COL_NAME,
  USERS_LABELS.COL_EMAIL,
  USERS_LABELS.COL_ROLE,
  USERS_LABELS.COL_STATUS,
  USERS_LABELS.COL_ACTIONS,
]

export const UsersTable = (): ReactElement => {
  const {
    users,
    total,
    currentPage,
    totalPages,
    isLoading,
    isError,
    currentUserId,
    onDelete,
    onPageChange,
  } = useUsersTable()

  const renderRow = (user: User): ReactElement => (
    <tr className={styles.row}>
      <td className={styles.cell}>
        <span className={styles.name}>{user.full_name}</span>
      </td>
      <td className={styles.cell}>
        <span className={styles.secondary}>{user.email}</span>
      </td>
      <td className={styles.cell}>
        <span className={user.role === USER_ROLE_VALUES.ADMIN ? styles.roleAdmin : styles.roleUser}>
          {user.role === USER_ROLE_VALUES.ADMIN ? USERS_LABELS.ROLE_ADMIN : USERS_LABELS.ROLE_USER}
        </span>
      </td>
      <td className={styles.cell}>
        <span className={user.is_active ? styles.statusActive : styles.statusInactive}>
          {user.is_active ? USERS_LABELS.STATUS_ACTIVE : USERS_LABELS.STATUS_INACTIVE}
        </span>
      </td>
      <td className={`${styles.cell} ${styles.actionsCell}`}>
        {user.id !== currentUserId && (
          <button
            className={styles.actionBtn}
            onClick={() => onDelete(user.id, user.full_name)}
            title={USERS_LABELS.TABLE_DELETE_TITLE}
          >
            🗑️
          </button>
        )}
      </td>
    </tr>
  )

  return (
    <DataTable
      headers={HEADERS}
      rows={users}
      keyExtractor={(u) => u.id}
      renderRow={renderRow}
      isLoading={isLoading}
      isError={isError}
      emptyTitle={USERS_LABELS.EMPTY_TITLE}
      emptyDescription={USERS_LABELS.EMPTY_DESC}
      emptyIcon="👤"
      errorTitle={USERS_LABELS.ERROR_LOAD}
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      onPageChange={onPageChange}
      paginationLabels={{
        totalPrefix: USERS_LABELS.TABLE_TOTAL,
        totalSuffix: USERS_LABELS.TABLE_USERS_SUFFIX,
        prev: USERS_LABELS.PAGE_PREV,
        next: USERS_LABELS.PAGE_NEXT,
      }}
    />
  )
}
