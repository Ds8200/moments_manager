'use client'
import { type MouseEvent } from 'react'
import { useSetAtom } from 'jotai'
import { useOrders, useUpdateOrderStatus, useDeleteOrder } from '../../queries/useOrders'
import { orderFiltersAtom, selectedOrderIdAtom, isOrderFormOpenAtom, editingOrderIdAtom } from '../../store/ordersAtoms'
import { formatCurrency, formatDateTime } from '@/shared/utils/formatters'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { OrderSummary, UrgencyLevel } from '../../types'
import type { OrderStatus } from '@/shared/enums/statusEnums'
import { PAYMENT_STATE_LABELS, getPaymentState } from '@/shared/enums/statusEnums'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { ROUTE_ICONS } from '@/shared/constants/routes'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'

export interface UseOrdersTableReturn {
  orders: OrderSummary[]
  total: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  isError: boolean
  menuState: DropdownMenuState
  onRowMenuClick: (order: OrderSummary, e: MouseEvent<Element>) => void
  closeMenu: () => void
  onStatusChange: (id: string, status: OrderStatus) => void
  onPageChange: (page: number) => void
  formatAmount: (amount: string) => string
  formatDate: (date: string) => string
  formatDueDateTime: (value: string | null) => string
  getUrgencyLabel: (urgency: UrgencyLevel) => string
  getUrgencyClass: (urgency: UrgencyLevel) => string
  getPaymentLabel: (isPaid: boolean, method: string | null) => string
  emptyIcon: string
}

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
  day:   '2-digit',
  month: '2-digit',
  hour:  '2-digit',
  minute:'2-digit',
})

export const useOrdersTable = (): UseOrdersTableReturn => {
  const { data, isLoading, isError } = useOrders()
  const setFilters = useSetAtom(orderFiltersAtom)
  const setSelectedId = useSetAtom(selectedOrderIdAtom)
  const setFormOpen = useSetAtom(isOrderFormOpenAtom)
  const setEditingId = useSetAtom(editingOrderIdAtom)
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const onViewOrder = (id: string): void => setSelectedId(id)

  const onEditOrder = (id: string): void => {
    setEditingId(id)
    setFormOpen(true)
  }

  const onDeleteOrder = (id: string): void => {
    confirm({
      message: ORDERS_LABELS.CONFIRM_DELETE,
      isDangerous: true,
      onConfirm: () => deleteOrder.mutate(id),
    })
  }

  const onRowMenuClick = (order: OrderSummary, e: MouseEvent<Element>): void => {
    openMenu(`#${order.order_number}`, [
      { label: ORDERS_LABELS.DETAIL_EDIT_TITLE, icon: ROUTE_ICONS.ORDERS, onClick: () => onViewOrder(order.id) },
      { label: ORDERS_LABELS.TABLE_EDIT_TITLE, icon: UI_SYMBOLS.EDIT, onClick: () => onEditOrder(order.id) },
      { label: ORDERS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDeleteOrder(order.id), variant: 'danger' },
    ], e)
  }

  return {
    orders: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,
    menuState,
    onRowMenuClick,
    closeMenu,

    onStatusChange: (id, status) => {
      updateStatus.mutate({ id, payload: { status } })
    },

    onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),

    formatAmount: formatCurrency,
    formatDate: formatDateTime,

    formatDueDateTime: (value) => {
      if (!value) return ORDERS_LABELS.URGENCY_NONE
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return ORDERS_LABELS.URGENCY_NONE
      return dueDateTimeFormatter.format(parsed)
    },

    getUrgencyLabel: (urgency) => URGENCY_LABEL_MAP[urgency],
    getUrgencyClass: (urgency) => URGENCY_CLASS_MAP[urgency],
    getPaymentLabel: (isPaid, method) => PAYMENT_STATE_LABELS[getPaymentState(isPaid, method)],
    emptyIcon: ROUTE_ICONS.ORDERS,
  }
}
