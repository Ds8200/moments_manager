'use client'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'

export interface SuperAdminUserDetailPageProps {
  userId: string
}

export interface UseSuperAdminUserDetailPageReturn {
  title: string
  backLabel: string
  comingSoon: string
  userId: string
  onBack: () => void
}

export const useSuperAdminUserDetailPage = (props: SuperAdminUserDetailPageProps): UseSuperAdminUserDetailPageReturn => {
  const router = useRouter()
  return {
    title: SUPER_ADMIN_LABELS.USER_DETAIL_TITLE,
    backLabel: SUPER_ADMIN_LABELS.BACK_TO_ORGS,
    comingSoon: UI_LABELS.DETAIL_COMING_SOON,
    userId: props.userId,
    onBack: () => router.push(ROUTES.SUPER_ADMIN_ORGS),
  }
}
