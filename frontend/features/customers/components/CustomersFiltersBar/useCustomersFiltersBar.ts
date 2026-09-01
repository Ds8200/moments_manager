'use client'
import { useAtom } from 'jotai'
import { useCallback } from 'react'
import { customerFiltersAtom } from '../../store/customersAtoms'
import type { CustomerFilters } from '../../types'

export interface UseCustomersFiltersBarReturn {
  searchValue: string
  onSearchChange: (value: string) => void
}

export const useCustomersFiltersBar = (): UseCustomersFiltersBarReturn => {
  const [filters, setFilters] = useAtom(customerFiltersAtom)

  const patch = useCallback(
    (p: Partial<CustomerFilters>) => setFilters((prev) => ({ ...prev, ...p, page: 1 })),
    [setFilters],
  )

  return {
    searchValue: filters.search,
    onSearchChange: (v) => patch({ search: v }),
  }
}
