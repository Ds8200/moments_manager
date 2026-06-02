'use client'
import { useAtom, useSetAtom } from 'jotai'
import { selectedOrderIdAtom, editingOrderIdAtom, isOrderFormOpenAtom } from '../../store/ordersAtoms'
import { useOrder } from '../../queries/useOrder'
import { useUpdateOrderStatus, useUpdateOrderPayment } from '../../queries/useOrders'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { STATUS_LABELS, STATUS_ORDER, PAYMENT_STATE_LABELS, PAYMENT_STATE_ORDER } from '@/shared/enums/statusEnums'
import type { OrderStatus, PaymentState } from '@/shared/enums/statusEnums'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import type { OrderUrgency } from '../../types'

export interface UseOrderDetailReturn {
  isOpen: boolean
  order: ReturnType<typeof useOrder>['data']
  isLoading: boolean
  statusOptions: Array<{ value: OrderStatus; label: string }>
  paymentState: PaymentState
  paymentOptions: Array<{ value: PaymentState; label: string }>
  onClose: () => void
  onEdit: () => void
  onStatusChange: (status: OrderStatus) => void
  onPaymentChange: (state: PaymentState) => void
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

const getPaymentState = (isPaid: boolean, method: string | null): PaymentState => {
  if (!isPaid) return 'unpaid'
  if (method === 'transfer') return 'transfer'
  return 'cash'
}

export const useOrderDetail = (): UseOrderDetailReturn => {
  const [selectedId, setSelectedId] = useAtom(selectedOrderIdAtom)
  const setEditingId = useSetAtom(editingOrderIdAtom)
  const setFormOpen = useSetAtom(isOrderFormOpenAtom)
  const { data: order, isLoading } = useOrder(selectedId)
  const updateStatus = useUpdateOrderStatus()
  const updatePayment = useUpdateOrderPayment()

  const statusOptions = STATUS_ORDER.map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
  }))

  const paymentOptions = PAYMENT_STATE_ORDER.map((s) => ({
    value: s,
    label: PAYMENT_STATE_LABELS[s],
  }))

  const paymentState = order
    ? getPaymentState(order.is_paid, order.payment_method)
    : 'unpaid'

  return {
    isOpen: selectedId !== null,
    order,
    isLoading,
    statusOptions,
    paymentState,
    paymentOptions,

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

    onPaymentChange: (state) => {
      if (!selectedId) return
      const payload =
        state === 'unpaid'
          ? { is_paid: false, payment_method: null }
          : { is_paid: true, payment_method: state }
      updatePayment.mutate({ id: selectedId, payload })
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
