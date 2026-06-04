'use client'
import { type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { useDeleteOrder } from '../../../queries/useOrders'
import { isOrderFormOpenAtom, editingOrderIdAtom } from '../../../store/ordersAtoms'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import { ROUTES } from '@/shared/constants/routes'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { Order } from '../../../types'

export interface OrderDetailHeaderProps {
  order: Order
}

export interface UseOrderDetailHeaderReturn {
  orderNumber: string
  customerName: string
  backLabel: string
  menuBtnSymbol: string
  menuState: DropdownMenuState
  onBack: () => void
  onMenuBtnClick: (e: MouseEvent<Element>) => void
  closeMenu: () => void
}

export const useOrderDetailHeader = (props: OrderDetailHeaderProps): UseOrderDetailHeaderReturn => {
  const router = useRouter()
  const setEditingId = useSetAtom(editingOrderIdAtom)
  const setFormOpen = useSetAtom(isOrderFormOpenAtom)
  const deleteOrder = useDeleteOrder()
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const onEdit = (): void => {
    setEditingId(props.order.id)
    setFormOpen(true)
  }

  const onDelete = (): void => {
    confirm({
      message: ORDERS_LABELS.CONFIRM_DELETE,
      isDangerous: true,
      onConfirm: () =>
        deleteOrder.mutate(props.order.id, {
          onSuccess: () => router.push(ROUTES.ORDERS),
        }),
    })
  }

  const menuItems = [
    { label: ORDERS_LABELS.DETAIL_PAGE_EDIT,   icon: UI_SYMBOLS.EDIT,   onClick: onEdit },
    { label: ORDERS_LABELS.DETAIL_PAGE_DELETE, icon: UI_SYMBOLS.DELETE, onClick: onDelete, variant: 'danger' as const },
  ]

  return {
    orderNumber:   props.order.order_number,
    customerName:  props.order.customer_name ?? '',
    backLabel:     ORDERS_LABELS.DETAIL_PAGE_BACK,
    menuBtnSymbol: UI_SYMBOLS.SETTINGS,

    menuState,
    closeMenu,

    onBack: () => router.push(ROUTES.ORDERS),

    onMenuBtnClick: (e) => openMenu(props.order.order_number, menuItems, e),
  }
}
