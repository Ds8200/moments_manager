'use client'

import { CHART_MONTH_LABELS } from '@/features/home/constants/homeLabels'
import { useHomeRevenue } from '@/features/home/queries/useHomeRevenue'
import type { RevenueChartDataPoint } from '@/features/home/types'

export interface UseHomeRevenueChartReturn {
  chartData: RevenueChartDataPoint[]
  isPending: boolean
  hasData: boolean
}

export const useHomeRevenueChart = (): UseHomeRevenueChartReturn => {
  const { data, isPending } = useHomeRevenue()

  const chartData: RevenueChartDataPoint[] = (() => {
    if (!data?.months) return []

    const currentMonth = new Date().getMonth() + 1 // 1-based
    const allMonths = data.months

    // Build last 6 months (inclusive of current month)
    const last6: RevenueChartDataPoint[] = []
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i
      if (m <= 0) m += 12
      const monthData = allMonths.find((entry) => entry.month === m)
      last6.push({
        month: CHART_MONTH_LABELS[m - 1],
        revenue: monthData ? parseFloat(monthData.total_revenue) : 0,
        expenses: monthData ? parseFloat(monthData.total_expenses) : 0,
      })
    }
    return last6
  })()

  const hasData = chartData.some((d) => d.revenue > 0 || d.expenses > 0)

  return { chartData, isPending, hasData }
}
