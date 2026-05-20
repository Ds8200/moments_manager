'use client'
import { useState } from 'react'
import { useSetAtom } from 'jotai'
import { useExpenses, useDeleteExpense } from '../../queries/useExpenses'
import { isExpenseFormOpenAtom, editingExpenseAtom } from '../../store/expensesAtoms'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { Expense, ExpensesResponse } from '../../types'

export interface UseExpensesPageReturn {
  data: ExpensesResponse | undefined
  isLoading: boolean
  isError: boolean
  page: number
  totalAmount: string
  onPageNext: () => void
  onNew: () => void
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
  formatAmount: (value: string | number) => string
  formatExpenseDate: (date: string) => string
}

export const useExpensesPage = (): UseExpensesPageReturn => {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useExpenses(page)
  const deleteExpense = useDeleteExpense()
  const setOpen = useSetAtom(isExpenseFormOpenAtom)
  const setEditingExpense = useSetAtom(editingExpenseAtom)

  const totalAmount = formatCurrency(
    data?.items.reduce((sum, e) => sum + parseFloat(e.amount), 0) ?? 0
  )

  const onNew = (): void => setOpen(true)

  const onEdit = (expense: Expense): void => {
    setEditingExpense(expense)
    setOpen(true)
  }

  const onDelete = (id: string): void => {
    if (window.confirm(EXPENSES_LABELS.CONFIRM_DELETE)) {
      deleteExpense.mutate(id)
    }
  }

  return {
    data,
    isLoading,
    isError,
    page,
    totalAmount,
    onPageNext: () => setPage((p) => p + 1),
    onNew,
    onEdit,
    onDelete,
    formatAmount: formatCurrency,
    formatExpenseDate: formatDate,
  }
}
