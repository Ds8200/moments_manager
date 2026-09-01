'use client'
import { Fragment, type ReactElement } from 'react'
import { useDataTable } from './useDataTable'
import type { DataTableProps } from './useDataTable'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { EmptyState } from '@/shared/components/EmptyState/EmptyState'
import styles from './DataTable.module.scss'

export const DataTable = <T,>(props: DataTableProps<T>): ReactElement => {
  const {
    headers, rows, keyExtractor, renderRow,
    showLoading, showError, showEmpty, showTable, showPagination,
    isPrevDisabled, isNextDisabled,
    currentPage, totalPages, total,
    onPageChange, paginationLabels,
    emptyTitle, emptyDescription, emptyIcon, errorTitle, errorIcon,
  } = useDataTable(props)

  if (showLoading) return <PageSkeleton rows={8} />

  if (showError) return <EmptyState title={errorTitle} description="" icon={errorIcon} />

  if (showEmpty) return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />

  return (
    <div className={styles.root}>
      {showTable && (
        <div className={styles.wrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                {headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Fragment key={keyExtractor(row)}>
                  {renderRow(row)}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPagination && (
        <div className={styles.pagination}>
          <span>{paginationLabels.totalPrefix} {total} {paginationLabels.totalSuffix}</span>
          <div className={styles.pageButtons}>
            <button
              className={styles.pageBtn}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={isPrevDisabled}
            >
              {paginationLabels.prev}
            </button>
            <span className={styles.pageBtn}>{currentPage} / {totalPages}</span>
            <button
              className={styles.pageBtn}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={isNextDisabled}
            >
              {paginationLabels.next}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
