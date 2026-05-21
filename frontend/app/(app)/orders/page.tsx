import type { Metadata } from 'next'
import { OrdersPage } from '@/features/orders/components/OrdersPage/OrdersPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.ORDERS_TITLE }

export default function Page() {
  return <OrdersPage />
}
