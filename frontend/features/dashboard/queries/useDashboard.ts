'use client'

import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { dashboardApi } from '../api'
import type { DashboardKpi } from '../types'

export const useDashboardKpi = (): UseQueryResult<DashboardKpi> => {
  return useQuery<DashboardKpi>({
    queryKey: ['dashboard', 'kpi'],
    queryFn: dashboardApi.getKpi,
    refetchInterval: 60_000,
  })
}
