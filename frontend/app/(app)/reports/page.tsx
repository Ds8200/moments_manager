import type { Metadata } from 'next'
import { ReportsPage } from '@/features/reports/components/ReportsPage/ReportsPage'

export const metadata: Metadata = { title: 'דוחות — Moments' }

export default function Page() {
  return <ReportsPage />
}
