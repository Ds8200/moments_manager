'use client'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { USERS_LABELS } from '../../constants/usersLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'

export interface UserDetailPageProps {
  userId: string
}

export interface UseUserDetailPageReturn {
  title: string
  backLabel: string
  comingSoon: string
  userId: string
  onBack: () => void
}

export const useUserDetailPage = (props: UserDetailPageProps): UseUserDetailPageReturn => {
  const router = useRouter()
  return {
    title: USERS_LABELS.DETAIL_TITLE,
    backLabel: UI_LABELS.BACK_TO_LIST,
    comingSoon: UI_LABELS.DETAIL_COMING_SOON,
    userId: props.userId,
    onBack: () => router.push(ROUTES.USERS),
  }
}
