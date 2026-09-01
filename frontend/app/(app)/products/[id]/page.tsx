import type { Metadata } from 'next'
import { ProductDetailPage } from '@/features/products/components/ProductDetailPage/ProductDetailPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.PRODUCT_DETAIL_TITLE }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProductDetailPage productId={id} />
}
