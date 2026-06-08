import type { Metadata } from 'next'
import { CreateOrgForm } from '@/features/superAdmin/components/CreateOrgForm/CreateOrgForm'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.SUPER_ADMIN_CREATE_ORG_TITLE }

export default function Page() {
  return <CreateOrgForm />
}
