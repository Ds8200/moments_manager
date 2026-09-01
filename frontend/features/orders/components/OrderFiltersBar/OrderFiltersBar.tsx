'use client'
import type { ReactElement } from 'react'
import { useOrderFiltersBar } from './useOrderFiltersBar'
import { FiltersBar } from '@/shared/components/FiltersBar/FiltersBar'
import { ORDERS_LABELS } from '../../constants/ordersLabels'

export const OrderFiltersBar = (): ReactElement => {
  const {
    filters,
    statusSelect,
    paymentSelect,
    sortSelect,
    onSearchChange,
    onDateFromChange,
    onDateToChange,
  } = useOrderFiltersBar()

  return (
    <FiltersBar
      searchValue={filters.search}
      searchPlaceholder={ORDERS_LABELS.SEARCH_PLACEHOLDER}
      onSearchChange={onSearchChange}
      selects={[statusSelect, paymentSelect, sortSelect]}
      dateFrom={filters.date_from}
      dateTo={filters.date_to}
      dateFromLabel={ORDERS_LABELS.DATE_FROM}
      dateToLabel={ORDERS_LABELS.DATE_TO}
      onDateFromChange={onDateFromChange}
      onDateToChange={onDateToChange}
    />
  )
}
