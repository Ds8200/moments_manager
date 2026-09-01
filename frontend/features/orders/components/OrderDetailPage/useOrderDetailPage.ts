'use client'
import { useRouter } from 'next/navigation'
import { useOrder, useUpdateOrder } from '../../queries/useOrder'
import { useDeleteOrder } from '../../queries/useOrders'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { ROUTES } from '@/shared/constants/routes'
import { formatCurrency } from '@/shared/utils/formatters'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { DropdownMenuItem } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { Order } from '../../types'

export interface OrderDetailPageProps {
  orderId: string
}

export interface UseOrderDetailPageReturn {
  order: Order | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
  backLabel: string
  menuTitle: string
  menuItems: DropdownMenuItem[]
  formattedTotal: string
  formattedCost: string
  formattedProfit: string
  getFileDownloadUrl: (fileId: string) => string
  sectionSummaryLabel: string
  labelTotal: string
  labelCost: string
  labelProfit: string
  sectionNotesLabel: string
  labelNotes: string
  onSaveNotes: (v: string) => void
  sectionFilesLabel: string
  attachmentSymbol: string
}

export const useOrderDetailPage = (props: OrderDetailPageProps): UseOrderDetailPageReturn => {
  const { orderId } = props
  const router = useRouter()
  const { data: order, isLoading, isError, refetch } = useOrder(orderId)
  const updateOrder = useUpdateOrder()
  const deleteOrder = useDeleteOrder()
  const confirm = useConfirm()

  const onDelete = (): void => {
    confirm({
      message: ORDERS_LABELS.CONFIRM_DELETE,
      isDangerous: true,
      onConfirm: () =>
        deleteOrder.mutate(orderId, {
          onSuccess: () => router.push(ROUTES.ORDERS),
        }),
    })
  }

  const menuItems: DropdownMenuItem[] = [
    { label: ORDERS_LABELS.DETAIL_PAGE_DELETE, icon: UI_SYMBOLS.DELETE, onClick: onDelete, variant: 'danger' as const },
  ]

  return {
    order,
    isLoading,
    isError,
    refetch,

    backLabel: ORDERS_LABELS.DETAIL_PAGE_BACK,
    menuTitle: order?.order_number ?? '',
    menuItems,

    formattedTotal:  order ? formatCurrency(order.total_amount) : '',
    formattedCost:   order ? formatCurrency(order.total_cost)   : '',
    formattedProfit: order ? formatCurrency(order.total_profit)  : '',

    getFileDownloadUrl: (fileId) => API_ENDPOINTS.ORDER_FILE(orderId, fileId),

    sectionSummaryLabel: ORDERS_LABELS.DETAIL_SECTION_SUMMARY,
    labelTotal:          ORDERS_LABELS.DETAIL_LABEL_TOTAL,
    labelCost:           ORDERS_LABELS.DETAIL_LABEL_COST,
    labelProfit:         ORDERS_LABELS.DETAIL_LABEL_PROFIT,
    sectionNotesLabel:   ORDERS_LABELS.DETAIL_SECTION_NOTES,
    labelNotes:          ORDERS_LABELS.FORM_NOTES,

    onSaveNotes: (value) => updateOrder.mutate({ id: orderId, payload: { notes: value } }),

    sectionFilesLabel: ORDERS_LABELS.DETAIL_SECTION_FILES,
    attachmentSymbol:  UI_SYMBOLS.ATTACHMENT,
  }
}
