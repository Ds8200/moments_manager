import type { Metadata } from 'next'
import { DashboardKpiGrid } from '@/features/dashboard/components/DashboardKpiGrid/DashboardKpiGrid'
import styles from './DashboardPage.module.scss'

export const metadata: Metadata = { title: 'דשבורד — Moments' }

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      <DashboardKpiGrid />
      <div className={styles.placeholderNote}>
        <p>גרפים והזמנות היום יתווספו בהמשך הבנייה</p>
      </div>
    </div>
  )
}
