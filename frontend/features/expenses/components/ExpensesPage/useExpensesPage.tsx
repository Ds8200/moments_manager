'use client'
import { useState, type MouseEvent } from 'react'
import { useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useExpenses, useDeleteExpense } from '../../queries/useExpenses'
import { isExpenseFormOpenAtom, editingExpenseAtom } from '../../store/expensesAtoms'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { ROUTE_ICONS, EXPENSE_DETAIL_ROUTE } from '@/shared/constants/routes'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { TableColumn, PaginationLabels } from '@/shared/components/DataTable/useDataTable'
import type { FiltersBarProps } from '@/shared/components/FiltersBar/useFiltersBar'
import type { Expense } from '../../types'
import styles from './ExpensesPage.module.scss'

export interface UseExpensesPageReturn {
  title: string
  actionLabel: string
  onAction: () => void
  filtersBarProps: FiltersBarProps | undefined
  columns: TableColumn<Expense>[]
  rows: Expense[]
  isLoading: boolean
  isError: boolean
  emptyTitle: string
  emptyDescription: string
  emptyIcon: string
  errorTitle: string
  currentPage: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  paginationLabels: PaginationLabels
  onRowLeftClick: (expense: Expense) => void
  onRowRightClick: (expense: Expense, e: MouseEvent<HTMLTableRowElement>) => void
  menuState: DropdownMenuState
  closeMenu: () => void
}

export const useExpensesPage = (): UseExpensesPageReturn => {
  const [page, setPage] = useState(1)
  const router = useRouter()
  const { data, isLoading, isError } = useExpenses(page)
  const deleteExpense = useDeleteExpense()
  const setOpen = useSetAtom(isExpenseFormOpenAtom)
  const setEditingExpense = useSetAtom(editingExpenseAtom)
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

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

  const columns: TableColumn<Expense>[] = [
    {
      key: 'date',
      header: EXPENSES_LABELS.COL_DATE,
      cell: (e) => formatDate(e.date),
    },
    {
      key: 'category',
      header: EXPENSES_LABELS.COL_CATEGORY,
      cell: (e) => (
        <span className={styles.categoryBadge}>
          {e.category?.name ?? UI_SYMBOLS.EM_DASH}
        </span>
      ),
    },
    {
      key: 'amount',
      header: EXPENSES_LABELS.COL_AMOUNT,
      cell: (e) => (
        <span className={styles.amount}>{formatCurrency(e.amount)}</span>
      ),
    },
    {
      key: 'notes',
      header: EXPENSES_LABELS.COL_NOTES,
      cell: (e) => e.notes ?? UI_SYMBOLS.EM_DASH,
    },
  ]

  return {
    title: EXPENSES_LABELS.PAGE_TITLE,
    actionLabel: EXPENSES_LABELS.NEW_EXPENSE,
    onAction: () => {
      setEditingExpense(null)
      setOpen(true)
    },
    filtersBarProps: undefined,
    columns,
    rows: data?.items ?? [],
    isLoading,
    isError,
    emptyTitle: EXPENSES_LABELS.EMPTY_TITLE,
    emptyDescription: EXPENSES_LABELS.EMPTY_DESC,
    emptyIcon: ROUTE_ICONS.EXPENSES,
    errorTitle: EXPENSES_LABELS.ERROR_LOAD,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    total: data?.total ?? 0,
    onPageChange: setPage,
    paginationLabels: {
      totalPrefix: EXPENSES_LABELS.TABLE_TOTAL,
      totalSuffix: EXPENSES_LABELS.TABLE_EXPENSES_SUFFIX,
      prev: EXPENSES_LABELS.PAGE_PREV,
      next: EXPENSES_LABELS.PAGE_NEXT,
    },
    onRowLeftClick: (expense) => router.push(EXPENSE_DETAIL_ROUTE(expense.id)),
    onRowRightClick: (expense, e) => {
      openMenu(formatDate(expense.date), [
        { label: EXPENSES_LABELS.TABLE_EDIT_TITLE, icon: UI_SYMBOLS.EDIT, onClick: () => onEdit(expense) },
        { label: EXPENSES_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDelete(expense.id), variant: 'danger' },
      ], e)
    },
    menuState,
    closeMenu,
  }
}
