import type { Metadata } from 'next'
import { UserDetailPage } from '@/features/users/components/UserDetailPage/UserDetailPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.USER_DETAIL_TITLE }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <UserDetailPage userId={id} />
}
