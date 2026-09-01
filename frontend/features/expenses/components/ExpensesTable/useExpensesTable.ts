'use client'
import { useAtom, useSetAtom } from 'jotai'
import { useExpenses, useDeleteExpense } from '../../queries/useExpenses'
import { expensesPageAtom, isExpenseFormOpenAtom, editingExpenseAtom } from '../../store/expensesAtoms'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useTableRowInteraction } from '@/shared/hooks/useTableRowInteraction'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { ROUTE_ICONS } from '@/shared/constants/routes'
import type { RowInteractionHandlers } from '@/shared/hooks/useTableRowInteraction'
import type { Expense } from '../../types'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'

export interface UseExpensesTableReturn {
  expenses: Expense[]
  total: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  isError: boolean
  menuState: DropdownMenuState
  getRowProps: (expense: Expense) => RowInteractionHandlers
  closeMenu: () => void
  onPageChange: (page: number) => void
  formatAmount: (value: string | number) => string
  formatExpenseDate: (date: string) => string
  emptyIcon: string
  emptyValue: string
}

export const useExpensesTable = (): UseExpensesTableReturn => {
  const [page, setPage] = useAtom(expensesPageAtom)
  const setFormOpen = useSetAtom(isExpenseFormOpenAtom)
  const setEditingExpense = useSetAtom(editingExpenseAtom)
  const { data, isLoading, isError } = useExpenses(page)
  const deleteExpense = useDeleteExpense()
  const confirm = useConfirm()
  const { menuState, closeMenu, getRowProps } = useTableRowInteraction()

  const onEdit = (expense: Expense): void => {
    setEditingExpense(expense)
    setFormOpen(true)
  }

  const onDelete = (id: string): void => {
    confirm({
      message: EXPENSES_LABELS.CONFIRM_DELETE,
      isDangerous: true,
      onConfirm: () => deleteExpense.mutate(id),
    })
  }

  return {
    expenses: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,
    menuState,
    closeMenu,

    // No standalone record page exists for expenses (flat records, fully edited inline) —
    // left-click opens the same edit modal the dropdown's edit item opens.
    getRowProps: (expense) => getRowProps({
      onActivate: () => onEdit(expense),
      menuTitle: formatDate(expense.date),
      items: [
        { label: EXPENSES_LABELS.TABLE_EDIT_TITLE, icon: UI_SYMBOLS.EDIT, onClick: () => onEdit(expense) },
        { label: EXPENSES_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDelete(expense.id), variant: 'danger' as const },
      ],
    }),

    onPageChange: (next) => setPage(next),
    formatAmount: formatCurrency,
    formatExpenseDate: formatDate,
    emptyIcon: ROUTE_ICONS.EXPENSES,
    emptyValue: UI_SYMBOLS.EM_DASH,
  }
}
