import type { Metadata } from 'next'
import { CustomerDetailPage } from '@/features/customers/components/CustomerDetailPage/CustomerDetailPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.CUSTOMER_DETAIL_TITLE }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CustomerDetailPage customerId={id} />
}
