'use client'
import type { ReactElement } from 'react'
import { useCustomersFiltersBar } from './useCustomersFiltersBar'
import { FiltersBar } from '@/shared/components/FiltersBar/FiltersBar'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'

export const CustomersFiltersBar = (): ReactElement => {
  const { searchValue, onSearchChange } = useCustomersFiltersBar()

  return (
    <FiltersBar
      searchValue={searchValue}
      searchPlaceholder={CUSTOMERS_LABELS.SEARCH_PLACEHOLDER}
      onSearchChange={onSearchChange}
    />
  )
}
