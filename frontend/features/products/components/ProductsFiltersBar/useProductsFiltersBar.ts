'use client'
import { useAtom, useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { productFiltersAtom, isProductFormOpenAtom } from '../../store/productsAtoms'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import type { ProductFilters } from '../../types'
import type { FiltersBarSelectConfig } from '@/shared/components/FiltersBar/useFiltersBar'

export interface UseProductsFiltersBarReturn {
  searchValue: string
  onSearchChange: (value: string) => void
  isActiveSelect: FiltersBarSelectConfig
  newButtonLabel: string
  onNew: () => void
}

export const useProductsFiltersBar = (): UseProductsFiltersBarReturn => {
  const [filters, setFilters] = useAtom(productFiltersAtom)
  const setFormOpen = useSetAtom(isProductFormOpenAtom)

  const patch = useCallback(
    (p: Partial<ProductFilters>) => setFilters((prev) => ({ ...prev, ...p, page: 1 })),
    [setFilters],
  )

  const isActiveValue = filters.is_active === null ? '' : String(filters.is_active)

  // cast: FiltersBar uses string; we convert '' → null, 'true' → true, 'false' → false
  const isActiveSelect: FiltersBarSelectConfig = {
    value: isActiveValue,
    options: [
      { value: '',      label: PRODUCTS_LABELS.ALL_STATUSES },
      { value: 'true',  label: PRODUCTS_LABELS.ACTIVE_ONLY },
      { value: 'false', label: PRODUCTS_LABELS.INACTIVE_ONLY },
    ],
    onChange: (v: string) => {
      const parsed = v === '' ? null : v === 'true'
      patch({ is_active: parsed })
    },
  }

  return {
    searchValue: filters.search,
    onSearchChange: (v) => patch({ search: v }),
    isActiveSelect,
    newButtonLabel: PRODUCTS_LABELS.NEW_PRODUCT,
    onNew: () => setFormOpen(true),
  }
}
