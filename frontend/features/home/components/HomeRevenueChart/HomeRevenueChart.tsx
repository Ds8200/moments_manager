'use client'

import type { ReactElement } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { HOME_CHART_LABELS } from '@/features/home/constants/homeLabels'
import { formatCurrency } from '@/shared/utils/formatters'
import { useHomeRevenueChart } from './useHomeRevenueChart'
import styles from './HomeRevenueChart.module.scss'

export const HomeRevenueChart = (): ReactElement => {
  const { chartData, isPending, hasData } = useHomeRevenueChart()

  if (isPending) {
    return <div className={styles.skeleton} />
  }

  if (!hasData) {
    return (
      <div className={styles.empty}>
        <p>{HOME_CHART_LABELS.NO_DATA}</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>{HOME_CHART_LABELS.TITLE}</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e6f6" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#888' }}
            tickFormatter={(v: number) => `₪${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === 'revenue' ? HOME_CHART_LABELS.REVENUE : HOME_CHART_LABELS.EXPENSES,
            ]}
            contentStyle={{ borderRadius: 8, fontSize: 13, direction: 'rtl' }}
          />
          <Legend
            formatter={(value: string) =>
              value === 'revenue' ? HOME_CHART_LABELS.REVENUE : HOME_CHART_LABELS.EXPENSES
            }
          />
          <Bar dataKey="revenue" fill="#9c27b0" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expenses" fill="#fa5252" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
