'use client'
import { useHomeKpi } from '../../queries/useHome'
import { formatCurrency } from '@/shared/utils/formatters'
import { HOME_KPI_LABELS } from '../../constants/homeLabels'
import type { KpiCardProps } from '../KpiCard/KpiCard'

export interface UseHomeKpiGridReturn {
  kpiCards: KpiCardProps[]
  isPending: boolean
}

export const useHomeKpiGrid = (): UseHomeKpiGridReturn => {
  const { data, isPending } = useHomeKpi()

  const kpiCards: KpiCardProps[] = data
    ? [
        { label: HOME_KPI_LABELS.OPEN_ORDERS, value: data.open_orders, icon: '📋', color: 'primary' },
        { label: HOME_KPI_LABELS.READY_ORDERS, value: data.ready_orders, icon: '✅', color: 'success' },
        { label: HOME_KPI_LABELS.MONTHLY_REVENUE, value: formatCurrency(data.monthly_revenue), icon: '💰', color: 'primary' },
        { label: HOME_KPI_LABELS.MONTHLY_PROFIT, value: formatCurrency(data.monthly_profit), icon: '📈', color: 'success' },
        {
          label: HOME_KPI_LABELS.UNPAID_AMOUNT,
          value: formatCurrency(data.unpaid_amount),
          icon: '⏳',
          color: parseFloat(data.unpaid_amount) > 0 ? 'warning' : 'default',
        },
      ]
    : []

  return { kpiCards, isPending }
}
