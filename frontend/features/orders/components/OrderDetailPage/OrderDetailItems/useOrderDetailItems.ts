'use client'
import { formatCurrency } from '@/shared/utils/formatters'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'
import type { OrderItem } from '../../../types'

export interface OrderDetailItemsProps {
  items: OrderItem[]
}

export interface UseOrderDetailItemsReturn {
  items: OrderItem[]
  formatAmount: (v: string) => string
  sectionTitle: string
  colProduct: string
  colQty: string
  colUnitPrice: string
  colUnitCost: string
  colTotal: string
  colProfit: string
  colDesignNotes: string
}

export const useOrderDetailItems = (props: OrderDetailItemsProps): UseOrderDetailItemsReturn => ({
  items:          props.items,
  formatAmount:   formatCurrency,
  sectionTitle:   ORDERS_LABELS.DETAIL_SECTION_ITEMS,
  colProduct:     ORDERS_LABELS.DETAIL_COL_PRODUCT,
  colQty:         ORDERS_LABELS.DETAIL_COL_QTY,
  colUnitPrice:   ORDERS_LABELS.DETAIL_COL_UNIT_PRICE,
  colUnitCost:    ORDERS_LABELS.DETAIL_COL_UNIT_COST,
  colTotal:       ORDERS_LABELS.DETAIL_COL_TOTAL,
  colProfit:      ORDERS_LABELS.DETAIL_COL_PROFIT,
  colDesignNotes: ORDERS_LABELS.DETAIL_COL_DESIGN_NOTES,
})
