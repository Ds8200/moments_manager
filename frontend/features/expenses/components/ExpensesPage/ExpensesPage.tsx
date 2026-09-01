'use client'
import type { ReactElement } from 'react'
import { useExpensesPage } from './useExpensesPage'
import { ExpensesTable } from '../ExpensesTable/ExpensesTable'
import { ExpenseForm } from '../ExpenseForm/ExpenseForm'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import styles from './ExpensesPage.module.scss'

export const ExpensesPage = (): ReactElement => {
  const { totalAmount, totalLabel, onNew } = useExpensesPage()

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{EXPENSES_LABELS.PAGE_TITLE}</h1>
        <button className={styles.newBtn} onClick={onNew}>{EXPENSES_LABELS.NEW_EXPENSE}</button>
      </div>

      <div className={styles.card}>
        <ExpensesTable />
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>{totalLabel}</span>
          <span className={styles.totalAmount}>{totalAmount}</span>
        </div>
      </div>

      <ExpenseForm />
    </div>
  )
}
