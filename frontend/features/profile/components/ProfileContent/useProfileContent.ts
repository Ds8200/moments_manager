'use client'

import { useProfileQuery } from '../../queries/useProfileQuery'
import { UI_LABELS } from '@/shared/constants/uiLabels'

export interface UseProfileContentReturn {
  pageTitle: string
  userEmail: string
}

export const useProfileContent = (): UseProfileContentReturn => {
  const { data: profile } = useProfileQuery()
  return {
    pageTitle: UI_LABELS.PROFILE_TITLE,
    userEmail: profile?.email ?? '',
  }
}
