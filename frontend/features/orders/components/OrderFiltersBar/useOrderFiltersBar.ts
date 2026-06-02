'use client'
import { useAtom, useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { orderFiltersAtom, isOrderFormOpenAtom, editingOrderIdAtom } from '../../store/ordersAtoms'
import { STATUS_ORDER, STATUS_LABELS, PAYMENT_STATE_ORDER, PAYMENT_STATE_LABELS } from '@/shared/enums/statusEnums'
import type { OrderStatus, PaymentState } from '@/shared/enums/statusEnums'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import type { OrderFilters } from '../../types'
import type { FiltersBarSelectConfig } from '@/shared/components/FiltersBar/useFiltersBar'

export interface UseOrderFiltersBarReturn {
  filters: OrderFilters
  statusSelect: FiltersBarSelectConfig
  paymentSelect: FiltersBarSelectConfig
  onSearchChange: (value: string) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onNewOrder: () => void
}

export const useOrderFiltersBar = (): UseOrderFiltersBarReturn => {
  const [filters, setFilters] = useAtom(orderFiltersAtom)
  const setFormOpen = useSetAtom(isOrderFormOpenAtom)
  const setEditingId = useSetAtom(editingOrderIdAtom)

  const patch = useCallback(
    (p: Partial<OrderFilters>) => setFilters((prev) => ({ ...prev, ...p, page: 1 })),
    [setFilters],
  )

  // cast: FiltersBar uses string for generic compatibility
  const statusSelect: FiltersBarSelectConfig = {
    value: filters.status,
    options: [
      { value: '', label: ORDERS_LABELS.ALL_STATUSES },
      ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
    ],
    onChange: (v: string) => patch({ status: v as OrderStatus | '' }),
  }

  // cast: FiltersBar uses string for generic compatibility
  const paymentSelect: FiltersBarSelectConfig = {
    value: filters.payment_state,
    options: [
      { value: '', label: ORDERS_LABELS.ALL_PAYMENT },
      ...PAYMENT_STATE_ORDER.map((s) => ({ value: s, label: PAYMENT_STATE_LABELS[s] })),
    ],
    onChange: (v: string) => patch({ payment_state: v as '' | PaymentState }),
  }

  return {
    filters,
    statusSelect,
    paymentSelect,
    onSearchChange:   (v) => patch({ search: v }),
    onDateFromChange: (v) => patch({ date_from: v }),
    onDateToChange:   (v) => patch({ date_to: v }),
    onNewOrder: () => {
      setEditingId(null)
      setFormOpen(true)
    },
  }
}
