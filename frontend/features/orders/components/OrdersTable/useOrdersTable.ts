'use client'
import { useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { useOrders, useUpdateOrderStatus, useDeleteOrder } from '../../queries/useOrders'
import { orderFiltersAtom } from '../../store/ordersAtoms'
import { formatCurrency, formatDateTime } from '@/shared/utils/formatters'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useTableRowInteraction } from '@/shared/hooks/useTableRowInteraction'
import type { RowInteractionHandlers } from '@/shared/hooks/useTableRowInteraction'
import type { OrderSummary, UrgencyLevel } from '../../types'
import type { OrderStatus } from '@/shared/enums/statusEnums'
import { PAYMENT_STATE_LABELS, getPaymentState } from '@/shared/enums/statusEnums'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { ORDER_DETAIL_ROUTE, ROUTE_ICONS } from '@/shared/constants/routes'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'

export interface UseOrdersTableReturn {
  orders: OrderSummary[]
  total: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  isError: boolean
  menuState: DropdownMenuState
  getRowProps: (order: OrderSummary) => RowInteractionHandlers
  closeMenu: () => void
  onStatusChange: (id: string, status: OrderStatus) => void
  onPageChange: (page: number) => void
  expandedOrderId: string | null
  toggleExpanded: (orderId: string, e: MouseEvent<Element>) => void
  formatAmount: (amount: string) => string
  formatDate: (date: string) => string
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

export const useOrdersTable = (): UseOrdersTableReturn => {
  const router = useRouter()
  const { data, isLoading, isError } = useOrders()
  const setFilters = useSetAtom(orderFiltersAtom)
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()
  const confirm = useConfirm()
  const { menuState, closeMenu, getRowProps } = useTableRowInteraction()
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const onDeleteOrder = (id: string): void => {
    confirm({
      message: ORDERS_LABELS.CONFIRM_DELETE,
      isDangerous: true,
      onConfirm: () => deleteOrder.mutate(id),
    })
  }

  const toggleExpanded = (orderId: string, e: MouseEvent<Element>): void => {
    e.stopPropagation()
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId))
  }

  return {
    orders: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,
    menuState,
    closeMenu,
    expandedOrderId,
    toggleExpanded,

    getRowProps: (order) => getRowProps({
      onActivate: () => router.push(ORDER_DETAIL_ROUTE(order.id)),
      menuTitle: `#${order.order_number}`,
      items: [
        { label: ORDERS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDeleteOrder(order.id), variant: 'danger' as const },
      ],
    }),

    onStatusChange: (id, status) => {
      updateStatus.mutate({ id, payload: { status } })
    },

    onPageChange: (page) => {
      setExpandedOrderId(null)
      setFilters((prev) => ({ ...prev, page }))
    },

    formatAmount: formatCurrency,
    formatDate: formatDateTime,

    getUrgencyLabel: (urgency) => URGENCY_LABEL_MAP[urgency],
    getUrgencyClass: (urgency) => URGENCY_CLASS_MAP[urgency],
    getPaymentLabel: (isPaid, method) => PAYMENT_STATE_LABELS[getPaymentState(isPaid, method)],
    emptyIcon: ROUTE_ICONS.ORDERS,
  }
}
