import type { Metadata } from 'next'
import { HomeKpiGrid } from '@/features/home/components/HomeKpiGrid/HomeKpiGrid'
import { HOME_LABELS, META_LABELS } from '@/shared/constants/uiLabels'
import styles from './HomePage.module.scss'

export const metadata: Metadata = { title: META_LABELS.HOME_TITLE }

export default function HomePage() {
  return (
    <div className={styles.page}>
      <HomeKpiGrid />
      <div className={styles.placeholderNote}>
        <p>{HOME_LABELS.COMING_SOON}</p>
      </div>
    </div>
  )
}
