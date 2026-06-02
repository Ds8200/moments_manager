'use client'
import type { ReactElement } from 'react'
import { useCustomersTable } from './useCustomersTable'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import styles from './CustomersTable.module.scss'
import type { Customer } from '../../types'

const HEADERS = [
  CUSTOMERS_LABELS.COL_NAME,
  CUSTOMERS_LABELS.COL_PHONE,
  CUSTOMERS_LABELS.COL_EMAIL,
  CUSTOMERS_LABELS.COL_ACTIONS,
]

export const CustomersTable = (): ReactElement => {
  const {
    customers,
    total,
    currentPage,
    totalPages,
    isLoading,
    isError,
    onEdit,
    onDelete,
    onEmail,
    onPageChange,
  } = useCustomersTable()

  const renderRow = (customer: Customer): ReactElement => (
    <tr className={styles.row}>
      <td className={styles.cell}>
        <span className={styles.name}>{customer.name}</span>
      </td>
      <td className={styles.cell}>
        <span className={styles.secondary}>{customer.phone ?? '—'}</span>
      </td>
      <td className={styles.cell}>
        <span className={styles.secondary}>{customer.email ?? '—'}</span>
      </td>
      <td className={`${styles.cell} ${styles.actionsCell}`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.actionBtn} onClick={() => onEmail(customer.id)} title={CUSTOMERS_LABELS.TABLE_EMAIL_TITLE}>✉️</button>
        <button className={styles.actionBtn} onClick={() => onEdit(customer.id)} title={CUSTOMERS_LABELS.TABLE_EDIT_TITLE}>✏️</button>
        <button className={styles.actionBtn} onClick={() => onDelete(customer.id, customer.name)} title={CUSTOMERS_LABELS.TABLE_DELETE_TITLE}>🗑️</button>
      </td>
    </tr>
  )

  return (
    <DataTable
      headers={HEADERS}
      rows={customers}
      keyExtractor={(c) => c.id}
      renderRow={renderRow}
      isLoading={isLoading}
      isError={isError}
      emptyTitle={CUSTOMERS_LABELS.EMPTY_TITLE}
      emptyDescription={CUSTOMERS_LABELS.EMPTY_DESC}
      emptyIcon="👥"
      errorTitle={CUSTOMERS_LABELS.ERROR_LOAD}
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      onPageChange={onPageChange}
      paginationLabels={{
        totalPrefix: CUSTOMERS_LABELS.TABLE_TOTAL,
        totalSuffix: CUSTOMERS_LABELS.TABLE_CUSTOMERS_SUFFIX,
        prev: CUSTOMERS_LABELS.PAGE_PREV,
        next: CUSTOMERS_LABELS.PAGE_NEXT,
      }}
    />
  )
}
