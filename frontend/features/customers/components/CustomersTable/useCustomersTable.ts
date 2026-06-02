'use client'
import { useAtomValue, useSetAtom } from 'jotai'
import { useCustomers, useDeleteCustomer } from '../../queries/useCustomers'
import { customerFiltersAtom, isCustomerFormOpenAtom, editingCustomerIdAtom } from '../../store/customersAtoms'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import { useConfirm } from '@/shared/hooks/useConfirm'
import type { Customer } from '../../types'

export interface UseCustomersTableReturn {
  customers: Customer[]
  total: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  isError: boolean
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
  onPageChange: (page: number) => void
}

export const useCustomersTable = (): UseCustomersTableReturn => {
  const filters = useAtomValue(customerFiltersAtom)
  const setFilters = useSetAtom(customerFiltersAtom)
  const setFormOpen = useSetAtom(isCustomerFormOpenAtom)
  const setEditingId = useSetAtom(editingCustomerIdAtom)
  const deleteCustomer = useDeleteCustomer()

  const { data, isLoading, isError } = useCustomers(filters.page, filters.search, filters.page_size)
  const confirm = useConfirm()

  return {
    customers: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,

    onEdit: (id) => {
      setEditingId(id)
      setFormOpen(true)
    },

    onDelete: (id, name) => {
      confirm({
        message: `${CUSTOMERS_LABELS.CONFIRM_DELETE} ${name}?`,
        isDangerous: true,
        onConfirm: () => deleteCustomer.mutate(id),
      })
    },

    onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
  }
}
