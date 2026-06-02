'use client'
import type { ReactElement } from 'react'
import { useProductsFiltersBar } from './useProductsFiltersBar'
import { FiltersBar } from '@/shared/components/FiltersBar/FiltersBar'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'

export const ProductsFiltersBar = (): ReactElement => {
  const { searchValue, onSearchChange, isActiveSelect, newButtonLabel, onNew } = useProductsFiltersBar()

  return (
    <FiltersBar
      searchValue={searchValue}
      searchPlaceholder={PRODUCTS_LABELS.SEARCH_PLACEHOLDER}
      onSearchChange={onSearchChange}
      selects={[isActiveSelect]}
      newButtonLabel={newButtonLabel}
      onNew={onNew}
    />
  )
}
