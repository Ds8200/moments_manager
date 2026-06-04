import type { Metadata } from 'next'
import { OrderDetailPage } from '@/features/orders/components/OrderDetailPage/OrderDetailPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.ORDER_DETAIL_TITLE }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OrderDetailPage orderId={id} />
}
