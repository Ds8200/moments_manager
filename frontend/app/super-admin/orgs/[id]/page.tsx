import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { OrgDetail } from '@/features/superAdmin/components/OrgDetail/OrgDetail'
import { META_LABELS } from '@/shared/constants/uiLabels'
import type { OrgAdminResponse } from '@/features/superAdmin/types'

export const metadata: Metadata = { title: META_LABELS.SUPER_ADMIN_ORG_DETAIL_TITLE }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value ?? ''

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/orgs/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (res.status === 404) notFound()
  if (!res.ok) throw new Error('Failed to load organization')

  const org: OrgAdminResponse = await res.json()

  return <OrgDetail initialOrg={org} />
}
