'use client'

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
  onDateFromChange?: (value: string) => void
  onDateToChange?: (value: string) => void
  newButtonLabel: string
  onNew: () => void
}

export interface UseFiltersBarReturn {
  searchValue: string
  searchPlaceholder: string
  onSearchChange: (value: string) => void
  selects: FiltersBarSelectConfig[]
  showDates: boolean
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  newButtonLabel: string
  onNew: () => void
}

const noop = (): void => undefined

export const useFiltersBar = (props: FiltersBarProps): UseFiltersBarReturn => {
  const {
    searchValue,
    searchPlaceholder,
    onSearchChange,
    selects,
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    newButtonLabel,
    onNew,
  } = props

  return {
    searchValue,
    searchPlaceholder,
    onSearchChange,
    selects: selects ?? [],
    showDates: onDateFromChange !== undefined || onDateToChange !== undefined,
    dateFrom: dateFrom ?? '',
    dateTo: dateTo ?? '',
    onDateFromChange: onDateFromChange ?? noop,
    onDateToChange: onDateToChange ?? noop,
    newButtonLabel,
    onNew,
  }
}
