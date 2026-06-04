'use client'
import { type MouseEvent } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useCustomers, useDeleteCustomer } from '../../queries/useCustomers'
import { customerFiltersAtom, isCustomerFormOpenAtom, editingCustomerIdAtom, emailingCustomerIdAtom } from '../../store/customersAtoms'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { ROUTE_ICONS } from '@/shared/constants/routes'
import type { Customer } from '../../types'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'

export interface UseCustomersTableReturn {
  customers: Customer[]
  total: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  isError: boolean
  menuState: DropdownMenuState
  onRowClick: (customer: Customer, e: MouseEvent<Element>) => void
  closeMenu: () => void
  onPageChange: (page: number) => void
  emptyIcon: string
  emptyValue: string
}

export const useCustomersTable = (): UseCustomersTableReturn => {
  const filters = useAtomValue(customerFiltersAtom)
  const setFilters = useSetAtom(customerFiltersAtom)
  const setFormOpen = useSetAtom(isCustomerFormOpenAtom)
  const setEditingId = useSetAtom(editingCustomerIdAtom)
  const setEmailingId = useSetAtom(emailingCustomerIdAtom)
  const deleteCustomer = useDeleteCustomer()
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const { data, isLoading, isError } = useCustomers(filters.page, filters.search, filters.page_size)

  const onEdit = (id: string): void => {
    setEditingId(id)
    setFormOpen(true)
  }

  const onDelete = (id: string, name: string): void => {
    confirm({
      message: `${CUSTOMERS_LABELS.CONFIRM_DELETE} ${name}?`,
      isDangerous: true,
      onConfirm: () => deleteCustomer.mutate(id),
    })
  }

  const onEmail = (id: string): void => setEmailingId(id)

  const onRowClick = (customer: Customer, e: MouseEvent<Element>): void => {
    openMenu(customer.name, [
      ...(customer.email ? [{ label: UI_LABELS.EMAIL_ACTION, icon: ROUTE_ICONS.EMAIL, onClick: () => onEmail(customer.id) }] : []),
      { label: CUSTOMERS_LABELS.TABLE_EDIT_TITLE, icon: UI_SYMBOLS.EDIT, onClick: () => onEdit(customer.id) },
      { label: CUSTOMERS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDelete(customer.id, customer.name), variant: 'danger' },
    ], e)
  }

  return {
    customers: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,
    menuState,
    onRowClick,
    closeMenu,
    onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
    emptyIcon: ROUTE_ICONS.CUSTOMERS,
    emptyValue: UI_SYMBOLS.EM_DASH,
  }
}
