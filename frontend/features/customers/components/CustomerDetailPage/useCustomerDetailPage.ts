'use client'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'

export interface CustomerDetailPageProps {
  customerId: string
}

export interface UseCustomerDetailPageReturn {
  title: string
  backLabel: string
  comingSoon: string
  customerId: string
  onBack: () => void
}

export const useCustomerDetailPage = (props: CustomerDetailPageProps): UseCustomerDetailPageReturn => {
  const router = useRouter()
  return {
    title: CUSTOMERS_LABELS.DETAIL_TITLE,
    backLabel: UI_LABELS.BACK_TO_LIST,
    comingSoon: UI_LABELS.DETAIL_COMING_SOON,
    customerId: props.customerId,
    onBack: () => router.push(ROUTES.CUSTOMERS),
  }
}
