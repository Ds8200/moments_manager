'use client'
import type { ReactElement, MouseEvent } from 'react'
import { useOrgsTab } from './useOrgsTab'
import type { OrgRow } from './useOrgsTab'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { FiltersBar } from '@/shared/components/FiltersBar/FiltersBar'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import styles from './OrgsTab.module.scss'

export const OrgsTab = (): ReactElement => {
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
  } = useOrgsTab()

  const renderRow = (org: OrgRow): ReactElement => (
    <tr className={styles.row}>
      <td className={styles.cell}><span className={styles.mono}>{org.orgNumber}</span></td>
      <td className={styles.cell}><span className={styles.bold}>{org.name}</span></td>
      <td className={styles.cell}><span className={styles.secondary}>{org.slug}</span></td>
      <td className={styles.cell}><span className={styles.secondary}>{org.ownerEmail}</span></td>
      <td className={styles.cell}>{org.planLabel}</td>
      <td className={styles.cell}>
        <span className={org.isActive ? styles.badgeActive : styles.badgeInactive}>
          {org.statusLabel}
        </span>
      </td>
      <td className={styles.cell}>{org.memberCount}</td>
      <td className={styles.cell}><span className={styles.secondary}>{org.createdAt}</span></td>
      <td className={styles.cell}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={(e: MouseEvent<HTMLButtonElement>) => onRowMenuClick(org, e)}
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
        keyExtractor={(o) => o.id}
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
