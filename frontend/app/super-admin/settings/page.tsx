import type { Metadata } from 'next'
import { SystemSettingsPage } from '@/features/systemSettings/components/SystemSettingsPage/SystemSettingsPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.SUPER_ADMIN_SETTINGS_TITLE }

export default function Page() {
  return <SystemSettingsPage />
}
