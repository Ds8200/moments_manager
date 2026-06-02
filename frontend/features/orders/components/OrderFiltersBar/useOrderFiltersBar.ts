'use client'
import { useAtom, useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { orderFiltersAtom, isOrderFormOpenAtom, editingOrderIdAtom } from '../../store/ordersAtoms'
import { STATUS_ORDER, STATUS_LABELS, PAYMENT_STATE_ORDER, PAYMENT_STATE_LABELS } from '@/shared/enums/statusEnums'
import type { OrderStatus, PaymentState } from '@/shared/enums/statusEnums'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import type { OrderFilters } from '../../types'

export interface UseOrderFiltersBarReturn {
  filters: OrderFilters
  statusOptions: Array<{ value: OrderStatus | ''; label: string }>
  paymentStateOptions: Array<{ value: '' | PaymentState; label: string }>
  onSearchChange: (value: string) => void
  onStatusChange: (value: OrderStatus | '') => void
  onPaymentStateChange: (value: '' | PaymentState) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onNewOrder: () => void
}

export const useOrderFiltersBar = (): UseOrderFiltersBarReturn => {
  const [filters, setFilters] = useAtom(orderFiltersAtom)
  const setFormOpen = useSetAtom(isOrderFormOpenAtom)
  const setEditingId = useSetAtom(editingOrderIdAtom)

  const patch = useCallback(
    (patch: Partial<OrderFilters>) =>
      setFilters((prev) => ({ ...prev, ...patch, page: 1 })),
    [setFilters],
  )

  const statusOptions = [
    { value: '' as const, label: ORDERS_LABELS.ALL_STATUSES },
    ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  ]

  const paymentStateOptions: Array<{ value: '' | PaymentState; label: string }> = [
    { value: '', label: ORDERS_LABELS.ALL_PAYMENT },
    ...PAYMENT_STATE_ORDER.map((s) => ({ value: s, label: PAYMENT_STATE_LABELS[s] })),
  ]

  return {
    filters,
    statusOptions,
    paymentStateOptions,
    onSearchChange:       (v) => patch({ search: v }),
    onStatusChange:       (v) => patch({ status: v }),
    onPaymentStateChange: (v) => patch({ payment_state: v }),
    onDateFromChange:     (v) => patch({ date_from: v }),
    onDateToChange:       (v) => patch({ date_to: v }),
    onNewOrder: () => {
      setEditingId(null)
      setFormOpen(true)
    },
  }
}
