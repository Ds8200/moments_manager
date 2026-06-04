'use client'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { useDeleteOrder } from '../../../queries/useOrders'
import { isOrderFormOpenAtom, editingOrderIdAtom } from '../../../store/ordersAtoms'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { ROUTES } from '@/shared/constants/routes'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { Order } from '../../../types'

export interface OrderDetailHeaderProps {
  order: Order
}

export interface UseOrderDetailHeaderReturn {
  orderNumber: string
  customerName: string
  backLabel: string
  editLabel: string
  deleteLabel: string
  editSymbol: string
  deleteSymbol: string
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export const useOrderDetailHeader = (props: OrderDetailHeaderProps): UseOrderDetailHeaderReturn => {
  const router = useRouter()
  const setEditingId = useSetAtom(editingOrderIdAtom)
  const setFormOpen = useSetAtom(isOrderFormOpenAtom)
  const deleteOrder = useDeleteOrder()
  const confirm = useConfirm()

  return {
    orderNumber:  props.order.order_number,
    customerName: props.order.customer_name ?? '',
    backLabel:    ORDERS_LABELS.DETAIL_PAGE_BACK,
    editLabel:    ORDERS_LABELS.DETAIL_PAGE_EDIT,
    deleteLabel:  ORDERS_LABELS.DETAIL_PAGE_DELETE,
    editSymbol:   UI_SYMBOLS.EDIT,
    deleteSymbol: UI_SYMBOLS.DELETE,

    onBack: () => router.push(ROUTES.ORDERS),

    onEdit: () => {
      setEditingId(props.order.id)
      setFormOpen(true)
    },

    onDelete: () => {
      confirm({
        message: ORDERS_LABELS.CONFIRM_DELETE,
        isDangerous: true,
        onConfirm: () =>
          deleteOrder.mutate(props.order.id, {
            onSuccess: () => router.push(ROUTES.ORDERS),
          }),
      })
    },
  }
}
