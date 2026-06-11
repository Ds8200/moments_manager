import type { Metadata } from 'next'
import { HomeKpiGrid } from '@/features/home/components/HomeKpiGrid/HomeKpiGrid'
import { HomeRevenueChart } from '@/features/home/components/HomeRevenueChart/HomeRevenueChart'
import { META_LABELS } from '@/shared/constants/uiLabels'
import styles from './HomePage.module.scss'

export const metadata: Metadata = { title: META_LABELS.HOME_TITLE }

export default function HomePage(): JSX.Element {
  return (
    <div className={styles.page}>
      <HomeKpiGrid />
      <HomeRevenueChart />
    </div>
  )
}
