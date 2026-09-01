'use client'
import type { ReactElement } from 'react'
import { useExpensesTable } from './useExpensesTable'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import styles from './ExpensesTable.module.scss'
import type { Expense } from '../../types'

const HEADERS = [
  EXPENSES_LABELS.COL_DATE,
  EXPENSES_LABELS.COL_CATEGORY,
  EXPENSES_LABELS.COL_AMOUNT,
  EXPENSES_LABELS.COL_NOTES,
]

export const ExpensesTable = (): ReactElement => {
  const {
    expenses,
    total,
    currentPage,
    totalPages,
    isLoading,
    isError,
    menuState,
    getRowProps,
    closeMenu,
    onPageChange,
    formatAmount,
    formatExpenseDate,
    emptyIcon,
    emptyValue,
  } = useExpensesTable()

  const renderRow = (expense: Expense): ReactElement => (
    <tr
      className={styles.row}
      {...getRowProps(expense)}
    >
      <td className={styles.cell}>{formatExpenseDate(expense.date)}</td>
      <td className={styles.cell}>
        <span className={styles.categoryBadge}>
          {expense.category?.name || emptyValue}
        </span>
      </td>
      <td className={styles.cell}>
        <span className={styles.amount}>{formatAmount(expense.amount)}</span>
      </td>
      <td className={styles.cell}>{expense.notes || emptyValue}</td>
    </tr>
  )

  return (
    <>
      <DataTable
        headers={HEADERS}
        rows={expenses}
        keyExtractor={(e) => e.id}
        renderRow={renderRow}
        isLoading={isLoading}
        isError={isError}
        emptyTitle={EXPENSES_LABELS.EMPTY_TITLE}
        emptyDescription={EXPENSES_LABELS.EMPTY_DESC}
        emptyIcon={emptyIcon}
        errorTitle={EXPENSES_LABELS.ERROR_LOAD}
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={onPageChange}
        paginationLabels={{
          totalPrefix: EXPENSES_LABELS.TABLE_TOTAL,
          totalSuffix: EXPENSES_LABELS.TABLE_EXPENSES_SUFFIX,
          prev: EXPENSES_LABELS.TABLE_PREV,
          next: EXPENSES_LABELS.TABLE_NEXT,
        }}
      />
      <DropdownMenu state={menuState} onClose={closeMenu} />
    </>
  )
}
