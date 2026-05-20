'use client'
import { useAtom, useSetAtom } from 'jotai'
import { useOrders, useUpdateOrderStatus, useDeleteOrder } from '../../queries/useOrders'
import { orderFiltersAtom, selectedOrderIdAtom, isOrderFormOpenAtom, editingOrderIdAtom } from '../../store/ordersAtoms'
import { formatCurrency, formatShortDate } from '@/shared/utils/formatters'
import type { OrderSummary } from '../../types'
import type { OrderStatus, PaymentMethod } from '@/shared/enums/statusEnums'
import { STATUS_LABELS, PAYMENT_LABELS } from '@/shared/enums/statusEnums'
import { ORDERS_LABELS } from '../../constants/ordersLabels'

export interface UseOrdersTableReturn {
  orders: OrderSummary[]
  total: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  isError: boolean
  onRowClick: (id: string) => void
  onEditOrder: (id: string) => void
  onDeleteOrder: (id: string) => void
  onStatusChange: (id: string, status: OrderStatus) => void
  onPageChange: (page: number) => void
  formatAmount: (amount: string) => string
  formatDate: (date: string) => string
  getPaymentLabel: (method: PaymentMethod | null, isPaid: boolean) => string
}

export const useOrdersTable = (): UseOrdersTableReturn => {
  const { data, isLoading, isError } = useOrders()
  const [filters, setFilters] = useAtom(orderFiltersAtom)
  const setSelectedId = useSetAtom(selectedOrderIdAtom)
  const setFormOpen = useSetAtom(isOrderFormOpenAtom)
  const setEditingId = useSetAtom(editingOrderIdAtom)
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()

  return {
    orders: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,

    onRowClick: (id) => setSelectedId(id),

    onEditOrder: (id) => {
      setEditingId(id)
      setFormOpen(true)
    },

    onDeleteOrder: (id) => {
      if (window.confirm(ORDERS_LABELS.CONFIRM_DELETE)) {
        deleteOrder.mutate(id)
      }
    },

    onStatusChange: (id, status) => {
      updateStatus.mutate({ id, payload: { status } })
    },

    onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),

    formatAmount: formatCurrency,
    formatDate: formatShortDate,

    getPaymentLabel: (method, isPaid) => {
      if (!isPaid) return '—'
      if (method && PAYMENT_LABELS[method]) return PAYMENT_LABELS[method]
      return ORDERS_LABELS.PAID
    },
  }
}
