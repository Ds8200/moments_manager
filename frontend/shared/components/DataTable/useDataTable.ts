'use client'
import type { MouseEvent, ReactNode } from 'react'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'

export interface PaginationLabels {
  totalPrefix: string
  totalSuffix: string
  prev: string
  next: string
}

export interface TableColumn<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  cellClassName?: string
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  keyExtractor: (row: T) => string
  isLoading: boolean
  isError: boolean
  emptyTitle: string
  emptyDescription: string
  emptyIcon: string
  errorTitle: string
  errorIcon?: string
  currentPage: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  paginationLabels: PaginationLabels
  onRowLeftClick?: (row: T) => void
  onRowRightClick?: (row: T, e: MouseEvent<HTMLTableRowElement>) => void
}

export interface UseDataTableReturn<T> {
  columns: TableColumn<T>[]
  rows: T[]
  keyExtractor: (row: T) => string
  showLoading: boolean
  showError: boolean
  showEmpty: boolean
  showTable: boolean
  showPagination: boolean
  isPrevDisabled: boolean
  isNextDisabled: boolean
  currentPage: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  paginationLabels: PaginationLabels
  emptyTitle: string
  emptyDescription: string
  emptyIcon: string
  errorTitle: string
  errorIcon: string
  isInteractive: boolean
  onRowLeftClick: ((row: T) => void) | undefined
  onRowRightClick: ((row: T, e: MouseEvent<HTMLTableRowElement>) => void) | undefined
}

export const useDataTable = <T>(props: DataTableProps<T>): UseDataTableReturn<T> => {
  const {
    columns, rows, keyExtractor,
    isLoading, isError,
    emptyTitle, emptyDescription, emptyIcon, errorTitle,
    currentPage, totalPages, total, onPageChange, paginationLabels,
    onRowLeftClick, onRowRightClick,
  } = props

  const showLoading = isLoading
  const showError = !isLoading && isError
  const showEmpty = !isLoading && !isError && rows.length === 0
  const showTable = !isLoading && !isError && rows.length > 0
  const showPagination = showTable && totalPages > 1

  return {
    columns,
    rows,
    keyExtractor,
    showLoading,
    showError,
    showEmpty,
    showTable,
    showPagination,
    isPrevDisabled: currentPage <= 1,
    isNextDisabled: currentPage >= totalPages,
    currentPage,
    totalPages,
    total,
    onPageChange,
    paginationLabels,
    emptyTitle,
    emptyDescription,
    emptyIcon,
    errorTitle,
    errorIcon: props.errorIcon ?? UI_SYMBOLS.WARNING,
    isInteractive: !!(onRowLeftClick || onRowRightClick),
    onRowLeftClick,
    onRowRightClick,
  }
}
