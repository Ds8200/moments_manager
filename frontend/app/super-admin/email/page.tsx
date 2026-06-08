import type { Metadata } from 'next'
import { SystemEmailPage } from '@/features/systemEmail/components/SystemEmailPage/SystemEmailPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.SUPER_ADMIN_EMAIL_TITLE }

export default function Page() {
  return <SystemEmailPage />
}
