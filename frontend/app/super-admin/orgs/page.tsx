import type { Metadata } from 'next'
import { OrgsTab } from '@/features/superAdmin/components/OrgsTab/OrgsTab'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.SUPER_ADMIN_TITLE }

export default function Page() {
  return <OrgsTab />
}
