import type { Metadata } from 'next'
import { ProfileContent } from '@/features/profile/components/ProfileContent/ProfileContent'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.PROFILE_TITLE_META }

export default function Page() {
  return <ProfileContent />
}
