'use client'
import { useAtomValue } from 'jotai'
import { useQuery } from '@tanstack/react-query'
import { isSysAdminAtom } from '@/features/auth/store/authAtoms'
import { organizationsApi } from '@/features/organizations/api'
import { UI_LABELS } from '@/shared/constants/uiLabels'

export const useAssistantName = (): string => {
  const isSysAdmin = useAtomValue(isSysAdminAtom)
  const { data: org } = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: () => organizationsApi.getMyOrg(),
    enabled: !isSysAdmin,
  })
  return org?.name ? `${org.name} AI` : UI_LABELS.AI_ASSISTANT_FALLBACK
}
