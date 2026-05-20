'use client'
import { useState } from 'react'
import { useExpenses, useDeleteExpense } from '../../queries/useExpenses'
import { EmptyState } from '@/shared/components/EmptyState/EmptyState'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { EXPENSE_CATEGORY_LABELS } from '@/shared/enums/statusEnums'
import styles from './ExpensesPage.module.scss'

const LABELS = {
  TITLE:       'הוצאות',
  NEW:         '+ הוצאה חדשה',
  EMPTY_TITLE: 'אין הוצאות',
  EMPTY_DESC:  'הוסף הוצאה ראשונה',
  COL_DATE:    'תאריך',
  COL_CATEGORY:'קטגוריה',
  COL_AMOUNT:  'סכום',
  COL_NOTES:   'הערות',
  COL_ACTIONS: '',
  TOTAL:       'סה"כ הוצאות:',
} as const

export function ExpensesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useExpenses(page)
  const deleteExpense = useDeleteExpense()

  const totalAmount = data?.items.reduce((sum, e) => sum + parseFloat(e.amount), 0) ?? 0

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{LABELS.TITLE}</h1>
        <button className={styles.newBtn}>{LABELS.NEW}</button>
      </div>

      {isLoading && <PageSkeleton rows={6} />}
      {isError && <EmptyState title="שגיאה בטעינת הוצאות" description="" icon="⚠️" />}

      {data && data.items.length === 0 && (
        <EmptyState title={LABELS.EMPTY_TITLE} description={LABELS.EMPTY_DESC} icon="💸" />
      )}

      {data && data.items.length > 0 && (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>{LABELS.COL_DATE}</th>
                <th>{LABELS.COL_CATEGORY}</th>
                <th>{LABELS.COL_AMOUNT}</th>
                <th>{LABELS.COL_NOTES}</th>
                <th>{LABELS.COL_ACTIONS}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((expense) => (
                <tr key={expense.id} className={styles.row}>
                  <td className={styles.cell}>{formatDate(expense.date)}</td>
                  <td className={styles.cell}>
                    <span className={styles.categoryBadge}>
                      {EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category}
                    </span>
                  </td>
                  <td className={styles.cell}>
                    <span className={styles.amount}>{formatCurrency(expense.amount)}</span>
                  </td>
                  <td className={styles.cell}>{expense.notes ?? '—'}</td>
                  <td className={styles.cell}>
                    <button
                      className={styles.actionBtn}
                      title="מחיקה"
                      onClick={() => {
                        if (window.confirm('למחוק הוצאה זו?')) {
                          deleteExpense.mutate(expense.id)
                        }
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>{LABELS.TOTAL}</span>
            <span className={styles.totalAmount}>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
