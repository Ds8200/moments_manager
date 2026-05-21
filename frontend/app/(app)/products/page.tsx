import type { Metadata } from 'next'
import { ProductsPage } from '@/features/products/components/ProductsPage/ProductsPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.PRODUCTS_TITLE }

export default function Page() {
  return <ProductsPage />
}
