'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api'
import type { DashboardKpi } from '../types'

export function useDashboardKpi() {
  return useQuery<DashboardKpi>({
    queryKey: ['dashboard', 'kpi'],
    queryFn: dashboardApi.getKpi,
    refetchInterval: 60_000,
  })
}
