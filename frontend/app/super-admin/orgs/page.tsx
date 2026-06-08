import type { Metadata } from 'next'
import { OrgsList } from '@/features/superAdmin/components/OrgsList/OrgsList'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.SUPER_ADMIN_TITLE }

export default function Page() {
  return <OrgsList />
}
