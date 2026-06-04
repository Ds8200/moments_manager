'use client'
import { useUpdateOrderStatus, useUpdateOrderPayment, useUpdateOrderUrgency } from '../../../queries/useOrders'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import {
  STATUS_LABELS, STATUS_ORDER,
  PAYMENT_STATE_LABELS, PAYMENT_STATE_ORDER,
  getPaymentState,
} from '@/shared/enums/statusEnums'
import type { OrderStatus, PaymentState } from '@/shared/enums/statusEnums'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'
import type { Order, UrgencyLevel } from '../../../types'

const URGENCY_ORDER: UrgencyLevel[] = ['normal', 'urgent', 'very_urgent']

const URGENCY_LABEL_MAP: Record<UrgencyLevel, string> = {
  normal:      ORDERS_LABELS.URGENCY_NORMAL,
  urgent:      ORDERS_LABELS.URGENCY_URGENT,
  very_urgent: ORDERS_LABELS.URGENCY_VERY_URGENT,
}

const detailDueFormatter = new Intl.DateTimeFormat('he-IL', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
})

export interface OrderDetailInfoProps {
  order: Order
}

export interface UseOrderDetailInfoReturn {
  customerName: string
  formattedDate: string
  formattedDue: string
  formattedAmount: string
  currentStatus: OrderStatus
  currentPaymentState: PaymentState
  currentUrgency: UrgencyLevel
  statusOptions: Array<{ value: string; label: string }>
  paymentOptions: Array<{ value: string; label: string }>
  urgencyOptions: Array<{ value: string; label: string }>
  onStatusChange: (v: OrderStatus) => void
  onPaymentChange: (v: PaymentState) => void
  onUrgencyChange: (v: UrgencyLevel) => void
  sectionTitle: string
  labelCustomer: string
  labelDate: string
  labelDue: string
  labelAmount: string
  labelStatus: string
  labelUrgency: string
  labelPayment: string
}

export const useOrderDetailInfo = (props: OrderDetailInfoProps): UseOrderDetailInfoReturn => {
  const { order } = props
  const updateStatus  = useUpdateOrderStatus()
  const updatePayment = useUpdateOrderPayment()
  const updateUrgency = useUpdateOrderUrgency()

  const currentPaymentState = getPaymentState(order.is_paid, order.payment_method)

  const statusOptions  = STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] }))
  const paymentOptions = PAYMENT_STATE_ORDER.map((s) => ({ value: s, label: PAYMENT_STATE_LABELS[s] }))
  const urgencyOptions = URGENCY_ORDER.map((u) => ({ value: u, label: URGENCY_LABEL_MAP[u] }))

  const formatDue = (value: string | null): string => {
    if (!value) return ORDERS_LABELS.URGENCY_NONE
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ORDERS_LABELS.URGENCY_NONE
    return detailDueFormatter.format(parsed)
  }

  return {
    customerName:        order.customer_name ?? '',
    formattedDate:       formatDate(order.date),
    formattedDue:        formatDue(order.due_datetime),
    formattedAmount:     formatCurrency(order.total_amount),
    currentStatus:       order.status as OrderStatus,
    currentPaymentState,
    currentUrgency:      order.urgency,

    statusOptions,
    paymentOptions,
    urgencyOptions,

    onStatusChange: (status) =>
      updateStatus.mutate({ id: order.id, payload: { status } }),

    onPaymentChange: (state) => {
      const payload =
        state === 'unpaid'
          ? { is_paid: false, payment_method: null }
          : { is_paid: true, payment_method: state }
      updatePayment.mutate({ id: order.id, payload })
    },

    onUrgencyChange: (level) =>
      updateUrgency.mutate({ id: order.id, payload: { urgency: level } }),

    sectionTitle:  ORDERS_LABELS.DETAIL_SECTION_INFO,
    labelCustomer: ORDERS_LABELS.DETAIL_LABEL_CUSTOMER,
    labelDate:     ORDERS_LABELS.DETAIL_LABEL_ORDER_DATE,
    labelDue:      ORDERS_LABELS.DETAIL_LABEL_DUE_DATE,
    labelAmount:   ORDERS_LABELS.DETAIL_LABEL_AMOUNT,
    labelStatus:   ORDERS_LABELS.DETAIL_LABEL_STATUS,
    labelUrgency:  ORDERS_LABELS.DETAIL_LABEL_URGENCY,
    labelPayment:  ORDERS_LABELS.DETAIL_LABEL_PAYMENT,
  }
}
