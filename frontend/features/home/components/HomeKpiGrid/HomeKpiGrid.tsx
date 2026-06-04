'use client'
import type { ReactElement } from 'react'
import { useHomeKpiGrid } from './useHomeKpiGrid'
import { KpiCard } from '../KpiCard/KpiCard'
import styles from './HomeKpiGrid.module.scss'

export const HomeKpiGrid = (): ReactElement => {
  const { kpiCards, isPending } = useHomeKpiGrid()

  return (
    <div className={styles.grid}>
      {isPending
        ? Array.from({ length: 5 }).map((_, i) => <div key={i} className={styles.skeleton} />)
        : kpiCards.map((card) => <KpiCard key={card.label} {...card} />)
      }
    </div>
  )
}
