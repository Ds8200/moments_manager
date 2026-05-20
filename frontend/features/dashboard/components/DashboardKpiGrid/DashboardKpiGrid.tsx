'use client'
import type { ReactElement } from 'react'
import { useDashboardKpiGrid } from './useDashboardKpiGrid'
import { KpiCard } from '../KpiCard/KpiCard'
import styles from './DashboardKpiGrid.module.scss'

export const DashboardKpiGrid = (): ReactElement => {
  const { kpiCards, isPending } = useDashboardKpiGrid()

  return (
    <div className={styles.grid}>
      {isPending
        ? Array.from({ length: 5 }).map((_, i) => <div key={i} className={styles.skeleton} />)
        : kpiCards.map((card) => <KpiCard key={card.label} {...card} />)
      }
    </div>
  )
}
