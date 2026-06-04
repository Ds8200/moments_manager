'use client'
import { useOrder } from '../../queries/useOrder'
import { formatCurrency } from '@/shared/utils/formatters'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { Order } from '../../types'

export interface OrderDetailPageProps {
  orderId: string
}

export interface UseOrderDetailPageReturn {
  order: Order | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
  formattedTotal: string
  formattedCost: string
  formattedProfit: string
  getFileDownloadUrl: (fileId: string) => string
  sectionSummaryLabel: string
  labelTotal: string
  labelCost: string
  labelProfit: string
  sectionNotesLabel: string
  sectionFilesLabel: string
  attachmentSymbol: string
}

export const useOrderDetailPage = (props: OrderDetailPageProps): UseOrderDetailPageReturn => {
  const { data: order, isLoading, isError, refetch } = useOrder(props.orderId)

  return {
    order,
    isLoading,
    isError,
    refetch,

    formattedTotal:  order ? formatCurrency(order.total_amount) : '',
    formattedCost:   order ? formatCurrency(order.total_cost)   : '',
    formattedProfit: order ? formatCurrency(order.total_profit)  : '',

    getFileDownloadUrl: (fileId) => API_ENDPOINTS.ORDER_FILE(props.orderId, fileId),

    sectionSummaryLabel: ORDERS_LABELS.DETAIL_SECTION_SUMMARY,
    labelTotal:          ORDERS_LABELS.DETAIL_LABEL_TOTAL,
    labelCost:           ORDERS_LABELS.DETAIL_LABEL_COST,
    labelProfit:         ORDERS_LABELS.DETAIL_LABEL_PROFIT,
    sectionNotesLabel:   ORDERS_LABELS.DETAIL_SECTION_NOTES,
    sectionFilesLabel:   ORDERS_LABELS.DETAIL_SECTION_FILES,
    attachmentSymbol:    UI_SYMBOLS.ATTACHMENT,
  }
}
