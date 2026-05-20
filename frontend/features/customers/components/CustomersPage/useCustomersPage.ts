'use client'
import { useState } from 'react'
import { useSetAtom } from 'jotai'
import { useCustomers, useDeleteCustomer } from '../../queries/useCustomers'
import { isCustomerFormOpenAtom, editingCustomerIdAtom } from '../../store/customersAtoms'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import type { CustomersResponse } from '../../types'

export interface UseCustomersPageReturn {
  data: CustomersResponse | undefined
  isLoading: boolean
  isError: boolean
  page: number
  search: string
  onSearchChange: (value: string) => void
  onPageNext: () => void
  onPagePrev: () => void
  onNew: () => void
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
}

export const useCustomersPage = (): UseCustomersPageReturn => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useCustomers(page, search)
  const deleteCustomer = useDeleteCustomer()
  const setOpen = useSetAtom(isCustomerFormOpenAtom)
  const setEditingId = useSetAtom(editingCustomerIdAtom)

  const onSearchChange = (value: string): void => {
    setSearch(value)
    setPage(1)
  }

  const onNew = (): void => setOpen(true)

  const onEdit = (id: string): void => {
    setEditingId(id)
    setOpen(true)
  }

  const onDelete = (id: string, name: string): void => {
    if (window.confirm(`${CUSTOMERS_LABELS.CONFIRM_DELETE} ${name}?`)) {
      deleteCustomer.mutate(id)
    }
  }

  return {
    data,
    isLoading,
    isError,
    page,
    search,
    onSearchChange,
    onPageNext: () => setPage((p) => p + 1),
    onPagePrev: () => setPage((p) => p - 1),
    onNew,
    onEdit,
    onDelete,
  }
}
