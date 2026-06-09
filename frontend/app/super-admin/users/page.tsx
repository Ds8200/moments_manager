import type { Metadata } from 'next'
import { UsersTab } from '@/features/superAdmin/components/UsersTab/UsersTab'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.SUPER_ADMIN_USERS_TITLE }

export default function Page() {
  return <UsersTab />
}
