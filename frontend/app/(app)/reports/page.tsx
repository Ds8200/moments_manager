import type { Metadata } from 'next'
import { ReportsPage } from '@/features/reports/components/ReportsPage/ReportsPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.REPORTS_TITLE }

export default function Page() {
  return <ReportsPage />
}
