import type { Metadata } from 'next'
import { OrdersPage } from '@/features/orders/components/OrdersPage/OrdersPage'

export const metadata: Metadata = { title: 'הזמנות — Moments' }

export default function Page() {
  return <OrdersPage />
}
