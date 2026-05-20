'use client'

import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { DashboardKpi } from './types'

export const dashboardApi = {
  getKpi: (): Promise<DashboardKpi> =>
    apiClient<DashboardKpi>(API_ENDPOINTS.REPORTS_DASHBOARD),
}
