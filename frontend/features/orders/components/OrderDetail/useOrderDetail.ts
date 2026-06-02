'use client'
import { useAtom, useSetAtom } from 'jotai'
import { selectedOrderIdAtom, editingOrderIdAtom, isOrderFormOpenAtom } from '../../store/ordersAtoms'
import { useOrder } from '../../queries/useOrder'
import { useUpdateOrderStatus, useUpdateOrderPayment, useUpdateOrderUrgency } from '../../queries/useOrders'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { STATUS_LABELS, STATUS_ORDER, PAYMENT_STATE_LABELS, PAYMENT_STATE_ORDER, getPaymentState } from '@/shared/enums/statusEnums'
import type { OrderStatus, PaymentState } from '@/shared/enums/statusEnums'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import type { UrgencyLevel } from '../../types'

const URGENCY_ORDER: UrgencyLevel[] = ['normal', 'urgent', 'very_urgent']

const URGENCY_LABEL_MAP: Record<UrgencyLevel, string> = {
  normal:      ORDERS_LABELS.URGENCY_NORMAL,
  urgent:      ORDERS_LABELS.URGENCY_URGENT,
  very_urgent: ORDERS_LABELS.URGENCY_VERY_URGENT,
}

const detailDueFormatter = new Intl.DateTimeFormat('he-IL', {
  day:    '2-digit',
  month:  '2-digit',
  year:   'numeric',
  hour:   '2-digit',
  minute: '2-digit',
})

export interface UseOrderDetailReturn {
  isOpen: boolean
  order: ReturnType<typeof useOrder>['data']
  isLoading: boolean
  statusOptions: Array<{ value: string; label: string }>
  paymentState: PaymentState
  paymentOptions: Array<{ value: string; label: string }>
  urgencyOptions: Array<{ value: string; label: string }>
  onClose: () => void
  onEdit: () => void
  onStatusChange: (status: OrderStatus) => void
  onPaymentChange: (state: PaymentState) => void
  onUrgencyChange: (level: UrgencyLevel) => void
  formatAmount: (v: string) => string
  formatOrderDate: (v: string) => string
  formatDueDateTime: (v: string | null) => string
}

export const useOrderDetail = (): UseOrderDetailReturn => {
  const [selectedId, setSelectedId] = useAtom(selectedOrderIdAtom)
  const setEditingId = useSetAtom(editingOrderIdAtom)
  const setFormOpen = useSetAtom(isOrderFormOpenAtom)
  const { data: order, isLoading } = useOrder(selectedId)
  const updateStatus = useUpdateOrderStatus()
  const updatePayment = useUpdateOrderPayment()
  const updateUrgency = useUpdateOrderUrgency()

  const statusOptions = STATUS_ORDER.map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
  }))

  const paymentOptions = PAYMENT_STATE_ORDER.map((s) => ({
    value: s,
    label: PAYMENT_STATE_LABELS[s],
  }))

  const urgencyOptions = URGENCY_ORDER.map((u) => ({
    value: u,
    label: URGENCY_LABEL_MAP[u],
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
    urgencyOptions,

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

    onUrgencyChange: (level) => {
      if (!selectedId) return
      updateUrgency.mutate({ id: selectedId, payload: { urgency: level } })
    },

    formatAmount: formatCurrency,
    formatOrderDate: formatDate,

    formatDueDateTime: (value) => {
      if (!value) return ORDERS_LABELS.URGENCY_NONE
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return ORDERS_LABELS.URGENCY_NONE
      return detailDueFormatter.format(parsed)
    },
  }
}
