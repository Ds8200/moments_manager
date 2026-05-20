'use client'
import { useAtom, useSetAtom } from 'jotai'
import { selectedOrderIdAtom, editingOrderIdAtom, isOrderFormOpenAtom } from '../../store/ordersAtoms'
import { useOrder } from '../../queries/useOrder'
import { useUpdateOrderStatus } from '../../queries/useOrders'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { STATUS_LABELS, STATUS_ORDER } from '@/shared/enums/statusEnums'
import type { OrderStatus } from '@/shared/enums/statusEnums'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import type { OrderUrgency } from '../../types'

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
  formatDueDateTime: (v: string | null) => string
  getUrgencyLabel: (urgency: OrderUrgency | null) => string
}

const URGENCY_LABEL_MAP: Record<OrderUrgency, string> = {
  critical: ORDERS_LABELS.URGENCY_CRITICAL,
  high:     ORDERS_LABELS.URGENCY_HIGH,
  medium:   ORDERS_LABELS.URGENCY_MEDIUM,
  low:      ORDERS_LABELS.URGENCY_LOW,
}

const detailDueFormatter = new Intl.DateTimeFormat('he-IL', {
  day:   '2-digit',
  month: '2-digit',
  year:  'numeric',
  hour:  '2-digit',
  minute:'2-digit',
})

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

    formatDueDateTime: (value) => {
      if (!value) return ORDERS_LABELS.URGENCY_NONE
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return ORDERS_LABELS.URGENCY_NONE
      return detailDueFormatter.format(parsed)
    },

    getUrgencyLabel: (urgency) => {
      if (!urgency) return ORDERS_LABELS.URGENCY_NONE
      return URGENCY_LABEL_MAP[urgency]
    },
  }
}
