'use client'
import type { ReactElement } from 'react'
import { useExpensesPage } from './useExpensesPage'
import { PageLayout } from '@/shared/components/PageLayout/PageLayout'
import { ExpensesTable } from '../ExpensesTable/ExpensesTable'
import { ExpenseForm } from '../ExpenseForm/ExpenseForm'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import styles from './ExpensesPage.module.scss'

export const ExpensesPage = (): ReactElement => {
  const { totalAmount, totalLabel, onNew } = useExpensesPage()

  return (
    <>
      <PageLayout
        title={EXPENSES_LABELS.PAGE_TITLE}
        actionLabel={EXPENSES_LABELS.NEW_EXPENSE}
        onAction={onNew}
      >
        <div className={styles.card}>
          <ExpensesTable />
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>{totalLabel}</span>
            <span className={styles.totalAmount}>{totalAmount}</span>
          </div>
        </div>
      </PageLayout>

      <ExpenseForm />
    </>
  )
}
