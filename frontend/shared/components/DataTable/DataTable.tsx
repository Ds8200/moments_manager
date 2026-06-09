'use client'
import type { MouseEvent, ReactElement } from 'react'
import { useDataTable } from './useDataTable'
import type { DataTableProps } from './useDataTable'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { EmptyState } from '@/shared/components/EmptyState/EmptyState'
import styles from './DataTable.module.scss'

export const DataTable = <T,>(props: DataTableProps<T>): ReactElement => {
  const {
    columns, rows, keyExtractor,
    showLoading, showError, showEmpty, showTable, showPagination,
    isPrevDisabled, isNextDisabled,
    currentPage, totalPages, total,
    onPageChange, paginationLabels,
    emptyTitle, emptyDescription, emptyIcon, errorTitle, errorIcon,
    isInteractive, onRowLeftClick, onRowRightClick,
  } = useDataTable(props)

  if (showLoading) return <PageSkeleton rows={8} />

  if (showError) return <EmptyState title={errorTitle} description="" icon={errorIcon} />

  if (showEmpty) return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />

  return (
    <div>
      {showTable && (
        <div className={styles.wrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className={`${styles.row}${isInteractive ? ` ${styles.rowInteractive}` : ''}`}
                  onClick={() => onRowLeftClick?.(row)}
                  onContextMenu={(e: MouseEvent<HTMLTableRowElement>) => {
                    e.preventDefault()
                    onRowRightClick?.(row, e)
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`${styles.cell}${col.cellClassName ? ` ${col.cellClassName}` : ''}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
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
