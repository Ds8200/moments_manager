'use client'
import { useCallback, useState } from 'react'
import { UI_LABELS } from '@/shared/constants/uiLabels'

export interface FiltersBarSelectConfig {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}

export interface FiltersBarProps {
  searchValue: string
  searchPlaceholder: string
  onSearchChange: (value: string) => void
  selects?: FiltersBarSelectConfig[]
  dateFrom?: string
  dateTo?: string
  dateFromLabel?: string
  dateToLabel?: string
  onDateFromChange?: (value: string) => void
  onDateToChange?: (value: string) => void
}

export interface UseFiltersBarReturn {
  searchValue: string
  searchPlaceholder: string
  onSearchChange: (value: string) => void
  selects: FiltersBarSelectConfig[]
  showDates: boolean
  dateFrom: string
  dateTo: string
  dateFromLabel: string
  dateToLabel: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  hasCollapsibleControls: boolean
  isExpanded: boolean
  toggleExpanded: () => void
  activeCount: number
  filtersToggleLabel: string
}

const noop = (): void => undefined

// A select counts as "active" when its value differs from its first option — the first option
// is the neutral default for both an "all X" filter (value '') and a default sort choice.
const countActiveSelects = (selects: FiltersBarSelectConfig[]): number =>
  selects.filter((sel) => sel.value !== sel.options[0]?.value).length

export const useFiltersBar = (props: FiltersBarProps): UseFiltersBarReturn => {
  const {
    searchValue,
    searchPlaceholder,
    onSearchChange,
    selects,
    dateFrom,
    dateTo,
    dateFromLabel,
    dateToLabel,
    onDateFromChange,
    onDateToChange,
  } = props

  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const toggleExpanded = useCallback(() => setIsExpanded((prev) => !prev), [])

  const resolvedSelects = selects ?? []
  const showDates = onDateFromChange !== undefined || onDateToChange !== undefined
  const resolvedDateFrom = dateFrom ?? ''
  const resolvedDateTo = dateTo ?? ''

  const activeCount =
    countActiveSelects(resolvedSelects) +
    (resolvedDateFrom ? 1 : 0) +
    (resolvedDateTo ? 1 : 0)

  return {
    searchValue,
    searchPlaceholder,
    onSearchChange,
    selects: resolvedSelects,
    showDates,
    dateFrom: resolvedDateFrom,
    dateTo: resolvedDateTo,
    dateFromLabel: dateFromLabel ?? '',
    dateToLabel: dateToLabel ?? '',
    onDateFromChange: onDateFromChange ?? noop,
    onDateToChange: onDateToChange ?? noop,
    hasCollapsibleControls: resolvedSelects.length > 0 || showDates,
    isExpanded,
    toggleExpanded,
    activeCount,
    filtersToggleLabel: UI_LABELS.FILTERS_TOGGLE,
  }
}
