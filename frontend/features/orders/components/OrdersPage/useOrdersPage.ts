'use client'
import { useCallback, type MouseEvent } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/shared/components/StatusBadge/StatusBadge'
import { useOrders, useDeleteOrder } from '../../queries/useOrders'
import { orderFiltersAtom, isOrderFormOpenAtom, editingOrderIdAtom } from '../../store/ordersAtoms'
import { formatCurrency, formatDateTime } from '@/shared/utils/formatters'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import {
  STATUS_ORDER, STATUS_LABELS,
  PAYMENT_STATE_ORDER, PAYMENT_STATE_LABELS,
  getPaymentState,
} from '@/shared/enums/statusEnums'
import type { OrderStatus, PaymentState } from '@/shared/enums/statusEnums'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { ORDER_DETAIL_ROUTE, ROUTE_ICONS } from '@/shared/constants/routes'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { TableColumn, PaginationLabels } from '@/shared/components/DataTable/useDataTable'
import type { FiltersBarProps } from '@/shared/components/FiltersBar/useFiltersBar'
import type { OrderSummary, UrgencyLevel, OrderFilters, OrderSortField } from '../../types'
import React from 'react'
import styles from './OrdersPage.module.scss'

const URGENCY_LABEL_MAP: Record<UrgencyLevel, string> = {
  normal:      ORDERS_LABELS.URGENCY_NORMAL,
  urgent:      ORDERS_LABELS.URGENCY_URGENT,
  very_urgent: ORDERS_LABELS.URGENCY_VERY_URGENT,
}

const URGENCY_CLASS_MAP: Record<UrgencyLevel, string> = {
  normal:      'urgencyNormal',
  urgent:      'urgencyUrgent',
  very_urgent: 'urgencyVeryUrgent',
}

const dueDateTimeFormatter = new Intl.DateTimeFormat('he-IL', {
  day:    '2-digit',
  month:  '2-digit',
  hour:   '2-digit',
  minute: '2-digit',
})

const formatDueDateTime = (value: string | null): string => {
  if (!value) return ORDERS_LABELS.URGENCY_NONE
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ORDERS_LABELS.URGENCY_NONE
  return dueDateTimeFormatter.format(parsed)
}

export interface UseOrdersPageReturn {
  title: string
  actionLabel: string
  onAction: () => void
  filtersBarProps: FiltersBarProps
  columns: TableColumn<OrderSummary>[]
  rows: OrderSummary[]
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
  onRowLeftClick: (order: OrderSummary) => void
  onRowRightClick: (order: OrderSummary, e: MouseEvent<HTMLTableRowElement>) => void
  menuState: DropdownMenuState
  closeMenu: () => void
}

export const useOrdersPage = (): UseOrdersPageReturn => {
  const [filters, setFilters] = useAtom(orderFiltersAtom)
  const setFormOpen = useSetAtom(isOrderFormOpenAtom)
  const setEditingId = useSetAtom(editingOrderIdAtom)
  const router = useRouter()
  const deleteOrder = useDeleteOrder()
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const { data, isLoading, isError } = useOrders()

  const patch = useCallback(
    (p: Partial<OrderFilters>) => setFilters((prev) => ({ ...prev, ...p, page: 1 })),
    [setFilters],
  )

  const onDelete = (id: string): void => {
    confirm({
      message: ORDERS_LABELS.CONFIRM_DELETE,
      isDangerous: true,
      onConfirm: () => deleteOrder.mutate(id),
    })
  }

  const columns: TableColumn<OrderSummary>[] = [
    {
      key: 'order_number',
      header: ORDERS_LABELS.COL_NUMBER,
      cell: (o) => React.createElement('span', { className: styles.orderNumber }, o.order_number),
    },
    {
      key: 'customer_name',
      header: ORDERS_LABELS.COL_CUSTOMER,
      cell: (o) => React.createElement('span', { className: styles.customerName }, o.customer_name),
    },
    {
      key: 'date',
      header: ORDERS_LABELS.COL_DATE,
      cell: (o) => formatDateTime(o.created_at),
    },
    {
      key: 'due_datetime',
      header: ORDERS_LABELS.COL_TARGET,
      cell: (o) => React.createElement('span', { className: styles.target }, formatDueDateTime(o.due_datetime)),
    },
    {
      key: 'urgency',
      header: ORDERS_LABELS.COL_URGENCY,
      cell: (o) => React.createElement(
        'span',
        { className: `${styles.urgencyBadge} ${styles[URGENCY_CLASS_MAP[o.urgency]]}` },
        URGENCY_LABEL_MAP[o.urgency],
      ),
    },
    {
      key: 'total_amount',
      header: ORDERS_LABELS.COL_AMOUNT,
      cell: (o) => React.createElement('span', { className: styles.amount }, formatCurrency(o.total_amount)),
    },
    {
      key: 'status',
      header: ORDERS_LABELS.COL_STATUS,
      cell: (o) => React.createElement(StatusBadge, { status: o.status }),
    },
    {
      key: 'payment',
      header: ORDERS_LABELS.COL_PAYMENT,
      cell: (o) => React.createElement(
        'span',
        { className: `${styles.paidBadge} ${o.is_paid ? styles.paid : styles.unpaid}` },
        PAYMENT_STATE_LABELS[getPaymentState(o.is_paid, o.payment_method)],
      ),
    },
  ]

  const filtersBarProps: FiltersBarProps = {
    searchValue: filters.search,
    searchPlaceholder: ORDERS_LABELS.SEARCH_PLACEHOLDER,
    onSearchChange: (v) => patch({ search: v }),
    selects: [
      {
        value: filters.status,
        options: [
          { value: '', label: ORDERS_LABELS.ALL_STATUSES },
          ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
        ],
        onChange: (v: string) => patch({ status: v as OrderStatus | '' }),
      },
      {
        value: filters.payment_state,
        options: [
          { value: '', label: ORDERS_LABELS.ALL_PAYMENT },
          ...PAYMENT_STATE_ORDER.map((s) => ({ value: s, label: PAYMENT_STATE_LABELS[s] })),
        ],
        onChange: (v: string) => patch({ payment_state: v as '' | PaymentState }),
      },
      {
        value: filters.sort_by,
        options: [
          { value: 'created_at',    label: ORDERS_LABELS.SORT_CREATED_AT },
          { value: 'customer_name', label: ORDERS_LABELS.SORT_CUSTOMER_NAME },
          { value: 'due_datetime',  label: ORDERS_LABELS.SORT_DUE_DATETIME },
          { value: 'urgency',       label: ORDERS_LABELS.SORT_URGENCY },
        ],
        onChange: (v: string) => patch({ sort_by: v as OrderSortField }),
      },
    ],
    dateFrom: filters.date_from,
    dateTo: filters.date_to,
    dateFromLabel: ORDERS_LABELS.DATE_FROM,
    dateToLabel: ORDERS_LABELS.DATE_TO,
    onDateFromChange: (v) => patch({ date_from: v }),
    onDateToChange: (v) => patch({ date_to: v }),
  }

  return {
    title: ORDERS_LABELS.PAGE_TITLE,
    actionLabel: ORDERS_LABELS.NEW_ORDER,
    onAction: () => {
      setEditingId(null)
      setFormOpen(true)
    },
    filtersBarProps,
    columns,
    rows: data?.items ?? [],
    isLoading,
    isError,
    emptyTitle: ORDERS_LABELS.EMPTY_TITLE,
    emptyDescription: ORDERS_LABELS.EMPTY_DESC,
    emptyIcon: ROUTE_ICONS.ORDERS,
    errorTitle: ORDERS_LABELS.ERROR,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    total: data?.total ?? 0,
    onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
    paginationLabels: {
      totalPrefix: ORDERS_LABELS.TABLE_TOTAL,
      totalSuffix: ORDERS_LABELS.TABLE_ORDERS_SUFFIX,
      prev: ORDERS_LABELS.TABLE_PREV,
      next: ORDERS_LABELS.TABLE_NEXT,
    },
    onRowLeftClick: (order) => router.push(ORDER_DETAIL_ROUTE(order.id)),
    onRowRightClick: (order, e) => {
      openMenu(`#${order.order_number}`, [
        { label: ORDERS_LABELS.TABLE_VIEW_TITLE, icon: ROUTE_ICONS.ORDERS, onClick: () => router.push(ORDER_DETAIL_ROUTE(order.id)) },
        { label: ORDERS_LABELS.TABLE_EDIT_TITLE, icon: UI_SYMBOLS.EDIT, onClick: () => { setEditingId(order.id); setFormOpen(true) } },
        { label: ORDERS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDelete(order.id), variant: 'danger' },
      ], e)
    },
    menuState,
    closeMenu,
  }
}
