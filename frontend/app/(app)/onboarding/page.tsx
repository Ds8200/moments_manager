import type { Metadata } from 'next'
import { OrgOnboarding } from '@/features/organizations/components/OrgOnboarding/OrgOnboarding'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.ONBOARDING_TITLE }

export default function Page() {
  return <OrgOnboarding />
}
