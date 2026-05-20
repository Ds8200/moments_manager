'use client'
import { useAtom, useSetAtom } from 'jotai'
import { selectedOrderIdAtom, editingOrderIdAtom, isOrderFormOpenAtom } from '../../store/ordersAtoms'
import { useOrder } from '../../queries/useOrder'
import { useUpdateOrderStatus } from '../../queries/useOrders'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { STATUS_LABELS, STATUS_ORDER } from '@/shared/enums/statusEnums'
import type { OrderStatus } from '@/shared/enums/statusEnums'

export interface UseOrderDetailReturn {
  isOpen: boolean
  order: ReturnType<typeof useOrder>['data']
  isLoading: boolean
  statusOptions: Array<{ value: OrderStatus; label: string }>
  onClose: () => void
  onEdit: () => void
  onStatusChange: (status: OrderStatus) => void
  formatAmount: (v: string) => string
  formatOrderDate: (v: string) => string
}

export const useOrderDetail = (): UseOrderDetailReturn => {
  const [selectedId, setSelectedId] = useAtom(selectedOrderIdAtom)
  const setEditingId = useSetAtom(editingOrderIdAtom)
  const setFormOpen = useSetAtom(isOrderFormOpenAtom)
  const { data: order, isLoading } = useOrder(selectedId)
  const updateStatus = useUpdateOrderStatus()

  const statusOptions = STATUS_ORDER.map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
  }))

  return {
    isOpen: selectedId !== null,
    order,
    isLoading,
    statusOptions,

    onClose: () => setSelectedId(null),

    onEdit: () => {
      if (!selectedId) return
      setEditingId(selectedId)
      setFormOpen(true)
      setSelectedId(null)
    },

    onStatusChange: (status) => {
      if (!selectedId) return
      updateStatus.mutate({ id: selectedId, payload: { status } })
    },

    formatAmount: formatCurrency,
    formatOrderDate: formatDate,
  }
}
