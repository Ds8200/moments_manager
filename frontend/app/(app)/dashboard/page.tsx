import type { Metadata } from 'next'
import { DashboardKpiGrid } from '@/features/dashboard/components/DashboardKpiGrid/DashboardKpiGrid'
import { DASHBOARD_LABELS, META_LABELS } from '@/shared/constants/uiLabels'
import styles from './DashboardPage.module.scss'

export const metadata: Metadata = { title: META_LABELS.DASHBOARD_TITLE }

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      <DashboardKpiGrid />
      <div className={styles.placeholderNote}>
        <p>{DASHBOARD_LABELS.COMING_SOON}</p>
      </div>
    </div>
  )
}
