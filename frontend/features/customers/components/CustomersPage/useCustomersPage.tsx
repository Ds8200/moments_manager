'use client'
import { useCallback, type MouseEvent } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useCustomers, useDeleteCustomer } from '../../queries/useCustomers'
import {
  customerFiltersAtom,
  isCustomerFormOpenAtom,
  editingCustomerIdAtom,
} from '../../store/customersAtoms'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { ROUTE_ICONS, ROUTES, CUSTOMER_DETAIL_ROUTE } from '@/shared/constants/routes'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { TableColumn, PaginationLabels } from '@/shared/components/DataTable/useDataTable'
import type { FiltersBarProps } from '@/shared/components/FiltersBar/useFiltersBar'
import type { Customer, CustomerFilters } from '../../types'
import styles from './CustomersPage.module.scss'

export interface UseCustomersPageReturn {
  title: string
  actionLabel: string
  onAction: () => void
  filtersBarProps: FiltersBarProps
  columns: TableColumn<Customer>[]
  rows: Customer[]
  isLoading: boolean
  isError: boolean
  emptyTitle: string
  emptyDescription: string
  emptyIcon: string
  errorTitle: string
  currentPage: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  paginationLabels: PaginationLabels
  onRowLeftClick: (customer: Customer) => void
  onRowRightClick: (customer: Customer, e: MouseEvent<HTMLTableRowElement>) => void
  menuState: DropdownMenuState
  closeMenu: () => void
}

export const useCustomersPage = (): UseCustomersPageReturn => {
  const [filters, setFilters] = useAtom(customerFiltersAtom)
  const setFormOpen = useSetAtom(isCustomerFormOpenAtom)
  const setEditingId = useSetAtom(editingCustomerIdAtom)
  const router = useRouter()
  const deleteCustomer = useDeleteCustomer()
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const { data, isLoading, isError } = useCustomers(filters.page, filters.search, filters.page_size)

  const patch = useCallback(
    (p: Partial<CustomerFilters>) => setFilters((prev) => ({ ...prev, ...p, page: 1 })),
    [setFilters],
  )

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

  const columns: TableColumn<Customer>[] = [
    {
      key: 'name',
      header: CUSTOMERS_LABELS.COL_NAME,
      cell: (c) => <span className={styles.name}>{c.name}</span>,
    },
    {
      key: 'phone',
      header: CUSTOMERS_LABELS.COL_PHONE,
      cell: (c) => <span className={styles.secondary}>{c.phone ?? UI_SYMBOLS.EM_DASH}</span>,
    },
    {
      key: 'email',
      header: CUSTOMERS_LABELS.COL_EMAIL,
      cell: (c) => <span className={styles.secondary}>{c.email ?? UI_SYMBOLS.EM_DASH}</span>,
    },
  ]

  return {
    title: CUSTOMERS_LABELS.PAGE_TITLE,
    actionLabel: CUSTOMERS_LABELS.NEW_CUSTOMER,
    onAction: () => {
      setEditingId(null)
      setFormOpen(true)
    },
    filtersBarProps: {
      searchValue: filters.search,
      searchPlaceholder: CUSTOMERS_LABELS.SEARCH_PLACEHOLDER,
      onSearchChange: (v) => patch({ search: v }),
    },
    columns,
    rows: data?.items ?? [],
    isLoading,
    isError,
    emptyTitle: CUSTOMERS_LABELS.EMPTY_TITLE,
    emptyDescription: CUSTOMERS_LABELS.EMPTY_DESC,
    emptyIcon: ROUTE_ICONS.CUSTOMERS,
    errorTitle: CUSTOMERS_LABELS.ERROR_LOAD,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    total: data?.total ?? 0,
    onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
    paginationLabels: {
      totalPrefix: CUSTOMERS_LABELS.TABLE_TOTAL,
      totalSuffix: CUSTOMERS_LABELS.TABLE_CUSTOMERS_SUFFIX,
      prev: CUSTOMERS_LABELS.PAGE_PREV,
      next: CUSTOMERS_LABELS.PAGE_NEXT,
    },
    onRowLeftClick: (customer) => router.push(CUSTOMER_DETAIL_ROUTE(customer.id)),
    onRowRightClick: (customer, e) => {
      openMenu(customer.name, [
        ...(customer.email
          ? [{ label: UI_LABELS.EMAIL_ACTION, icon: ROUTE_ICONS.EMAIL, onClick: () => router.push(ROUTES.SEND_EMAIL + '?customerId=' + customer.id) }]
          : []),
        { label: CUSTOMERS_LABELS.TABLE_EDIT_TITLE, icon: UI_SYMBOLS.EDIT, onClick: () => onEdit(customer.id) },
        { label: CUSTOMERS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDelete(customer.id, customer.name), variant: 'danger' },
      ], e)
    },
    menuState,
    closeMenu,
  }
}
