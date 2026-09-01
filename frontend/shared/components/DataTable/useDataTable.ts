'use client'
import { type ReactElement, type RefObject, useEffect, useRef } from 'react'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { getRtlStartScrollLeft } from '@/shared/utils/scroll'

export interface PaginationLabels {
  totalPrefix: string
  totalSuffix: string
  prev: string
  next: string
}

export interface DataTableProps<T> {
  headers: string[]
  rows: T[]
  keyExtractor: (row: T) => string
  renderRow: (row: T) => ReactElement
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
}

export interface UseDataTableReturn<T> {
  headers: string[]
  rows: T[]
  keyExtractor: (row: T) => string
  renderRow: (row: T) => ReactElement
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
  wrapperRef: RefObject<HTMLDivElement | null>
}

export const useDataTable = <T>(props: DataTableProps<T>): UseDataTableReturn<T> => {
  const {
    headers, rows, keyExtractor, renderRow,
    isLoading, isError,
    emptyTitle, emptyDescription, emptyIcon, errorTitle,
    currentPage, totalPages, total, onPageChange, paginationLabels,
  } = props

  const showLoading = isLoading
  const showError = !isLoading && isError
  const showEmpty = !isLoading && !isError && rows.length === 0
  const showTable = !isLoading && !isError && rows.length > 0
  const showPagination = showTable && totalPages > 1

  // The scroll box is `direction: ltr` (scrollbar-right mixin), which anchors horizontal
  // scroll to the left. In this RTL app the table's first column is on the right, so open
  // it there — on first render and whenever a new page loads.
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    el.scrollLeft = getRtlStartScrollLeft(el.scrollWidth, el.clientWidth)
  }, [showTable, currentPage])

  return {
    headers,
    rows,
    keyExtractor,
    renderRow,
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
    wrapperRef,
  }
}
