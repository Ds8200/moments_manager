'use client'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { useOrgsList } from './useOrgsList'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import styles from './OrgsList.module.scss'

export const OrgsList = (): ReactElement => {
  const {
    pageTitle,
    orgs,
    isLoading,
    isError,
    emptyLabel,
    colName,
    colSlug,
    colPlan,
    colStatus,
    colMembers,
    colCreated,
    colActions,
    menuState,
    createOrgHref,
    addOrgLabel,
    onRowMenuClick,
    closeMenu,
  } = useOrgsList()

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{pageTitle}</h1>
        <Link href={createOrgHref} className={styles.addOrgBtn}>
          {addOrgLabel}
        </Link>
      </div>

      {!isLoading && !isError && orgs.length === 0 && <p className={styles.empty}>{emptyLabel}</p>}

      {orgs.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>{colName}</th>
                <th className={styles.th}>{colSlug}</th>
                <th className={styles.th}>{colPlan}</th>
                <th className={styles.th}>{colStatus}</th>
                <th className={styles.th}>{colMembers}</th>
                <th className={styles.th}>{colCreated}</th>
                <th className={styles.th}>{colActions}</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className={styles.tr}>
                  <td className={styles.td}>{org.name}</td>
                  <td className={styles.td}>{org.slug}</td>
                  <td className={styles.td}>{org.planLabel}</td>
                  <td className={styles.td}>{org.statusLabel}</td>
                  <td className={styles.td}>{org.memberCount}</td>
                  <td className={styles.td}>{org.createdAt}</td>
                  <td className={styles.td}>
                    <button
                      type="button"
                      className={styles.menuBtn}
                      onClick={(e) => onRowMenuClick(org, e)}
                      aria-label={org.name}
                    >
                      {UI_SYMBOLS.MENU}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DropdownMenu state={menuState} onClose={closeMenu} />
    </div>
  )
}
