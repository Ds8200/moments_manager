'use client'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'

export interface ProductDetailPageProps {
  productId: string
}

export interface UseProductDetailPageReturn {
  title: string
  backLabel: string
  comingSoon: string
  productId: string
  onBack: () => void
}

export const useProductDetailPage = (props: ProductDetailPageProps): UseProductDetailPageReturn => {
  const router = useRouter()
  return {
    title: PRODUCTS_LABELS.DETAIL_TITLE,
    backLabel: UI_LABELS.BACK_TO_LIST,
    comingSoon: UI_LABELS.DETAIL_COMING_SOON,
    productId: props.productId,
    onBack: () => router.push(ROUTES.PRODUCTS),
  }
}
