'use client'
import { useState, type MouseEvent } from 'react'
import { useSetAtom } from 'jotai'
import { useExpenses, useDeleteExpense } from '../../queries/useExpenses'
import { isExpenseFormOpenAtom, editingExpenseAtom } from '../../store/expensesAtoms'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { ROUTE_ICONS } from '@/shared/constants/routes'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'
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
  onRowMenuClick: (expense: Expense, e: MouseEvent<Element>) => void
  menuState: DropdownMenuState
  closeMenu: () => void
  formatAmount: (value: string | number) => string
  formatExpenseDate: (date: string) => string
  emptyErrorIcon: string
  emptyStateIcon: string
  emptyValue: string
}

export const useExpensesPage = (): UseExpensesPageReturn => {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useExpenses(page)
  const deleteExpense = useDeleteExpense()
  const setOpen = useSetAtom(isExpenseFormOpenAtom)
  const setEditingExpense = useSetAtom(editingExpenseAtom)
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const totalAmount = formatCurrency(
    data?.items.reduce((sum, e) => sum + parseFloat(e.amount), 0) ?? 0
  )

  const onNew = (): void => setOpen(true)

  const onEdit = (expense: Expense): void => {
    setEditingExpense(expense)
    setOpen(true)
  }

  const onDelete = (id: string): void => {
    confirm({
      message: EXPENSES_LABELS.CONFIRM_DELETE,
      isDangerous: true,
      onConfirm: () => deleteExpense.mutate(id),
    })
  }

  const onRowMenuClick = (expense: Expense, e: MouseEvent<Element>): void => {
    openMenu(formatDate(expense.date), [
      { label: EXPENSES_LABELS.TABLE_EDIT_TITLE,   icon: UI_SYMBOLS.EDIT,   onClick: () => onEdit(expense) },
      { label: EXPENSES_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDelete(expense.id), variant: 'danger' },
    ], e)
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
    onRowMenuClick,
    menuState,
    closeMenu,
    formatAmount: formatCurrency,
    formatExpenseDate: formatDate,
    emptyErrorIcon: UI_SYMBOLS.WARNING,
    emptyStateIcon: ROUTE_ICONS.EXPENSES,
    emptyValue: UI_SYMBOLS.EM_DASH,
  }
}
