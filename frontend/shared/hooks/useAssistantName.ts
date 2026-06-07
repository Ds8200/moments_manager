'use client'
import { useMyOrg } from '@/features/organizations/queries/useOrganizations'
import { UI_LABELS } from '@/shared/constants/uiLabels'

export const useAssistantName = (): string => {
  const { data: org } = useMyOrg()
  return org?.name ? `${org.name} AI` : UI_LABELS.AI_ASSISTANT_FALLBACK
}
