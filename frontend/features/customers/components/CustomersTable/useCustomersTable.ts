'use client'
import { useAtomValue, useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useCustomers, useDeleteCustomer } from '../../queries/useCustomers'
import { customerFiltersAtom } from '../../store/customersAtoms'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import { ROUTES, ROUTE_ICONS, CUSTOMER_DETAIL_ROUTE } from '@/shared/constants/routes'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useTableRowInteraction } from '@/shared/hooks/useTableRowInteraction'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { RowInteractionHandlers } from '@/shared/hooks/useTableRowInteraction'
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
  getRowProps: (customer: Customer) => RowInteractionHandlers
  closeMenu: () => void
  onPageChange: (page: number) => void
  emptyIcon: string
  emptyValue: string
}

export const useCustomersTable = (): UseCustomersTableReturn => {
  const filters = useAtomValue(customerFiltersAtom)
  const setFilters = useSetAtom(customerFiltersAtom)
  const router = useRouter()
  const deleteCustomer = useDeleteCustomer()
  const confirm = useConfirm()
  const { menuState, closeMenu, getRowProps } = useTableRowInteraction()

  const { data, isLoading, isError } = useCustomers(filters.page, filters.search, filters.page_size)

  const onDelete = (id: string, name: string): void => {
    confirm({
      message: `${CUSTOMERS_LABELS.CONFIRM_DELETE} ${name}?`,
      isDangerous: true,
      onConfirm: () => deleteCustomer.mutate(id),
    })
  }

  const onEmail = (id: string): void => {
    router.push(ROUTES.SEND_EMAIL + '?customerId=' + id)
  }

  return {
    customers: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,
    menuState,
    closeMenu,

    getRowProps: (customer) => getRowProps({
      onActivate: () => router.push(CUSTOMER_DETAIL_ROUTE(customer.id)),
      menuTitle: customer.name,
      items: [
        ...(customer.email ? [{ label: UI_LABELS.EMAIL_ACTION, icon: ROUTE_ICONS.EMAIL, onClick: () => onEmail(customer.id) }] : []),
        { label: CUSTOMERS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDelete(customer.id, customer.name), variant: 'danger' as const },
      ],
    }),

    onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
    emptyIcon: ROUTE_ICONS.CUSTOMERS,
    emptyValue: UI_SYMBOLS.EM_DASH,
  }
}
