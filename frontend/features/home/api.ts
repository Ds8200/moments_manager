'use client'

import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { HomeKpi } from './types'

export const homeApi = {
  getKpi: (): Promise<HomeKpi> =>
    apiClient<HomeKpi>(API_ENDPOINTS.REPORTS_HOME),
}
