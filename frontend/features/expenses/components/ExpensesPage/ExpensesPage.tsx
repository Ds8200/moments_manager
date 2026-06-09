'use client'
import type { ReactElement, MouseEvent } from 'react'
import { useExpensesPage } from './useExpensesPage'
import { ExpenseForm } from '../ExpenseForm/ExpenseForm'
import { EmptyState } from '@/shared/components/EmptyState/EmptyState'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import styles from './ExpensesPage.module.scss'

export const ExpensesPage = (): ReactElement => {
  const {
    data, isLoading, isError,
    onNew, onRowMenuClick, menuState, closeMenu,
    formatAmount, formatExpenseDate, emptyErrorIcon, emptyStateIcon, emptyValue,
  } = useExpensesPage()

  return (
    <>
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <h1 className={styles.title}>{EXPENSES_LABELS.PAGE_TITLE}</h1>
          <button className={styles.newBtn} onClick={onNew}>{EXPENSES_LABELS.NEW_EXPENSE}</button>
        </div>

        {isLoading && <PageSkeleton rows={6} />}
        {isError && <EmptyState title={EXPENSES_LABELS.ERROR_LOAD} description="" icon={emptyErrorIcon} />}

        {data && data.items.length === 0 && (
          <EmptyState title={EXPENSES_LABELS.EMPTY_TITLE} description={EXPENSES_LABELS.EMPTY_DESC} icon={emptyStateIcon} />
        )}

        {data && data.items.length > 0 && (
          <div className={styles.card}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>{EXPENSES_LABELS.COL_DATE}</th>
                  <th>{EXPENSES_LABELS.COL_CATEGORY}</th>
                  <th>{EXPENSES_LABELS.COL_AMOUNT}</th>
                  <th>{EXPENSES_LABELS.COL_NOTES}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((expense) => (
                  <tr
                    key={expense.id}
                    className={styles.row}
                    onClick={(e: MouseEvent<HTMLTableRowElement>) => onRowMenuClick(expense, e)}
                  >
                    <td className={styles.cell}>{formatExpenseDate(expense.date)}</td>
                    <td className={styles.cell}>
                      <span className={styles.categoryBadge}>
                        {expense.category?.name ?? emptyValue}
                      </span>
                    </td>
                    <td className={styles.cell}>
                      <span className={styles.amount}>{formatAmount(expense.amount)}</span>
                    </td>
                    <td className={styles.cell}>{expense.notes ?? emptyValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <ExpenseForm />
      </div>
      <DropdownMenu state={menuState} onClose={closeMenu} />
    </>
  )
}
