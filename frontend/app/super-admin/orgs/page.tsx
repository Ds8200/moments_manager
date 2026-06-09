import type { Metadata } from 'next'
import { SuperAdminOrgsPage } from '@/features/superAdmin/components/SuperAdminOrgsPage/SuperAdminOrgsPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.SUPER_ADMIN_TITLE }

export default function Page() {
  return <SuperAdminOrgsPage />
}
