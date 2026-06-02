import type { Metadata } from 'next'
import { UsersPage } from '@/features/users/components/UsersPage/UsersPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.USERS_TITLE }

export default function Page() {
  return <UsersPage />
}
