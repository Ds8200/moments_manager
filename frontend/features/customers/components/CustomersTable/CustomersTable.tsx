'use client'
import type { ReactElement } from 'react'
import { useCustomersTable } from './useCustomersTable'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import styles from './CustomersTable.module.scss'
import type { Customer } from '../../types'

const HEADERS = [
  CUSTOMERS_LABELS.COL_NAME,
  CUSTOMERS_LABELS.COL_PHONE,
  CUSTOMERS_LABELS.COL_EMAIL,
]

export const CustomersTable = (): ReactElement => {
  const {
    customers,
    total,
    currentPage,
    totalPages,
    isLoading,
    isError,
    menuState,
    getRowProps,
    closeMenu,
    onPageChange,
    emptyIcon,
    emptyValue,
  } = useCustomersTable()

  const renderRow = (customer: Customer): ReactElement => (
    <tr
      className={styles.row}
      {...getRowProps(customer)}
    >
      <td className={styles.cell}>
        <span className={styles.name}>{customer.name}</span>
      </td>
      <td className={styles.cell}>
        <span className={styles.secondary}>{customer.phone || emptyValue}</span>
      </td>
      <td className={styles.cell}>
        <span className={styles.secondary}>{customer.email || emptyValue}</span>
      </td>
    </tr>
  )

  return (
    <>
      <DataTable
        headers={HEADERS}
        rows={customers}
        keyExtractor={(c) => c.id}
        renderRow={renderRow}
        isLoading={isLoading}
        isError={isError}
        emptyTitle={CUSTOMERS_LABELS.EMPTY_TITLE}
        emptyDescription={CUSTOMERS_LABELS.EMPTY_DESC}
        emptyIcon={emptyIcon}
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
      <DropdownMenu state={menuState} onClose={closeMenu} />
    </>
  )
}
