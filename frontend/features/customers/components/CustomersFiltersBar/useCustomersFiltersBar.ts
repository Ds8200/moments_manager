'use client'
import { useAtom, useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { customerFiltersAtom, isCustomerFormOpenAtom, editingCustomerIdAtom } from '../../store/customersAtoms'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import type { CustomerFilters } from '../../types'

export interface UseCustomersFiltersBarReturn {
  searchValue: string
  onSearchChange: (value: string) => void
  newButtonLabel: string
  onNew: () => void
}

export const useCustomersFiltersBar = (): UseCustomersFiltersBarReturn => {
  const [filters, setFilters] = useAtom(customerFiltersAtom)
  const setFormOpen = useSetAtom(isCustomerFormOpenAtom)
  const setEditingId = useSetAtom(editingCustomerIdAtom)

  const patch = useCallback(
    (p: Partial<CustomerFilters>) => setFilters((prev) => ({ ...prev, ...p, page: 1 })),
    [setFilters],
  )

  return {
    searchValue: filters.search,
    onSearchChange: (v) => patch({ search: v }),
    newButtonLabel: CUSTOMERS_LABELS.NEW_CUSTOMER,
    onNew: () => {
      setEditingId(null)
      setFormOpen(true)
    },
  }
}
