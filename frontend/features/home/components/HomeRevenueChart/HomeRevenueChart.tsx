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
import { useHomeRevenueChart } from './useHomeRevenueChart'
import styles from './HomeRevenueChart.module.scss'

export const HomeRevenueChart = (): ReactElement => {
  const { chartData, isPending, hasData, formatYAxis, formatTooltip, formatLegend } = useHomeRevenueChart()

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
            tickFormatter={formatYAxis}
            width={48}
          />
          <Tooltip
            formatter={formatTooltip}
            contentStyle={{ borderRadius: 8, fontSize: 13, direction: 'rtl' }}
          />
          <Legend
            formatter={formatLegend}
            wrapperStyle={{ direction: 'ltr' }}
          />
          <Bar dataKey="revenue" fill="#9c27b0" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expenses" fill="#fa5252" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
