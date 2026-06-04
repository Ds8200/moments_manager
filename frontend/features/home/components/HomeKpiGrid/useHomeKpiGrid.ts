'use client'
import { useDashboardKpi } from '../../queries/useDashboard'
import { formatCurrency } from '@/shared/utils/formatters'
import { DASHBOARD_LABELS } from '../../constants/dashboardLabels'
import type { KpiCardProps } from '../KpiCard/KpiCard'

export interface UseDashboardKpiGridReturn {
  kpiCards: KpiCardProps[]
  isPending: boolean
}

export const useDashboardKpiGrid = (): UseDashboardKpiGridReturn => {
  const { data, isPending } = useDashboardKpi()

  const kpiCards: KpiCardProps[] = data
    ? [
        { label: DASHBOARD_LABELS.OPEN_ORDERS, value: data.open_orders, icon: '📋', color: 'primary' },
        { label: DASHBOARD_LABELS.READY_ORDERS, value: data.ready_orders, icon: '✅', color: 'success' },
        { label: DASHBOARD_LABELS.MONTHLY_REVENUE, value: formatCurrency(data.monthly_revenue), icon: '💰', color: 'primary' },
        { label: DASHBOARD_LABELS.MONTHLY_PROFIT, value: formatCurrency(data.monthly_profit), icon: '📈', color: 'success' },
        {
          label: DASHBOARD_LABELS.UNPAID_AMOUNT,
          value: formatCurrency(data.unpaid_amount),
          icon: '⏳',
          color: parseFloat(data.unpaid_amount) > 0 ? 'warning' : 'default',
        },
      ]
    : []

  return { kpiCards, isPending }
}
