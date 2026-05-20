'use client'

import { useDashboardKpi } from '../../queries/useDashboard'
import { KpiCard } from '../KpiCard/KpiCard'
import { formatCurrency } from '@/shared/utils/formatters'
import styles from './DashboardKpiGrid.module.scss'

export function DashboardKpiGrid() {
  const { data, isPending } = useDashboardKpi()

  if (isPending) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className={styles.grid}>
      <KpiCard
        label="הזמנות פתוחות"
        value={data.open_orders}
        icon="📋"
        color="primary"
      />
      <KpiCard
        label="מוכנות לאיסוף"
        value={data.ready_orders}
        icon="✅"
        color="success"
      />
      <KpiCard
        label="הכנסות החודש"
        value={formatCurrency(data.monthly_revenue)}
        icon="💰"
        color="primary"
      />
      <KpiCard
        label="רווח החודש"
        value={formatCurrency(data.monthly_profit)}
        icon="📈"
        color="success"
      />
      <KpiCard
        label="ממתין לתשלום"
        value={formatCurrency(data.unpaid_amount)}
        icon="⏳"
        color={parseFloat(data.unpaid_amount) > 0 ? 'warning' : 'default'}
      />
    </div>
  )
}
