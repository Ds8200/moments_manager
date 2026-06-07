import type { Metadata } from 'next'
import { OrgSettings } from '@/features/organizations/components/OrgSettings/OrgSettings'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.SETTINGS_TITLE }

export default function Page() {
  return <OrgSettings />
}
