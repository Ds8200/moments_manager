'use client'
import type { ReactElement, MouseEvent } from 'react'
import { useUsersTab } from './useUsersTab'
import type { UserRow } from './useUsersTab'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { FiltersBar } from '@/shared/components/FiltersBar/FiltersBar'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import styles from './UsersTab.module.scss'

export const UsersTab = (): ReactElement => {
  const {
    rows,
    headers,
    isLoading,
    isError,
    emptyTitle,
    emptyIcon,
    errorTitle,
    currentPage,
    totalPages,
    total,
    paginationLabels,
    onPageChange,
    filtersBarProps,
    menuState,
    closeMenu,
    onRowMenuClick,
  } = useUsersTab()

  const renderRow = (user: UserRow): ReactElement => (
    <tr className={styles.row}>
      <td className={styles.cell}><span className={styles.bold}>{user.fullName}</span></td>
      <td className={styles.cell}><span className={styles.secondary}>{user.email}</span></td>
      <td className={styles.cell}><span className={styles.secondary}>{user.phone ?? UI_SYMBOLS.EM_DASH}</span></td>
      <td className={styles.cell}>{user.orgCount}</td>
      <td className={styles.cell}><span className={styles.secondary}>{user.createdAt}</span></td>
      <td className={styles.cell}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={(e: MouseEvent<HTMLButtonElement>) => onRowMenuClick(user, e)}
        >
          {UI_SYMBOLS.MENU}
        </button>
      </td>
    </tr>
  )

  return (
    <>
      <FiltersBar {...filtersBarProps} />
      <DataTable
        headers={headers}
        rows={rows}
        keyExtractor={(u) => u.id}
        renderRow={renderRow}
        isLoading={isLoading}
        isError={isError}
        emptyTitle={emptyTitle}
        emptyDescription=""
        emptyIcon={emptyIcon}
        errorTitle={errorTitle}
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={onPageChange}
        paginationLabels={paginationLabels}
      />
      <DropdownMenu state={menuState} onClose={closeMenu} />
    </>
  )
}
