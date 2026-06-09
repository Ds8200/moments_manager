import type { Metadata } from 'next'
import { SuperAdminUserDetailPage } from '@/features/superAdmin/components/SuperAdminUserDetailPage/SuperAdminUserDetailPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.SUPER_ADMIN_USER_DETAIL_TITLE }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SuperAdminUserDetailPage userId={id} />
}
