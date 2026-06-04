'use client'

import { CHART_MONTH_LABELS, HOME_CHART_LABELS } from '@/features/home/constants/homeLabels'
import { useHomeRevenue } from '@/features/home/queries/useHomeRevenue'
import type { RevenueChartDataPoint } from '@/features/home/types'
import { formatCurrency } from '@/shared/utils/formatters'

export interface UseHomeRevenueChartReturn {
  chartData: RevenueChartDataPoint[]
  isPending: boolean
  hasData: boolean
  formatYAxis: (v: number) => string
  formatTooltip: (value: number, name: string) => [string, string]
  formatLegend: (value: string) => string
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

  const formatYAxis = (v: number): string => {
    if (v === 0) return '₪0'
    if (v >= 1000) return `₪${(v / 1000).toFixed(0)}k`
    return `₪${Math.round(v)}`
  }

  const formatTooltip = (value: number, name: string): [string, string] => [
    formatCurrency(value),
    name === 'revenue' ? HOME_CHART_LABELS.REVENUE : HOME_CHART_LABELS.EXPENSES,
  ]

  const formatLegend = (value: string): string =>
    value === 'revenue' ? HOME_CHART_LABELS.REVENUE : HOME_CHART_LABELS.EXPENSES

  return { chartData, isPending, hasData, formatYAxis, formatTooltip, formatLegend }
}
