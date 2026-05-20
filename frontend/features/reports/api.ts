'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { MonthlyReport, FinancialReport, TopCustomer } from './types'

export const reportsApi = {
  monthly: (year: number, month: number): Promise<MonthlyReport> =>
    apiClient<MonthlyReport>(`${API_ENDPOINTS.REPORTS_MONTHLY}?year=${year}&month=${month}`),

  financial: (year: number): Promise<FinancialReport> =>
    apiClient<FinancialReport>(`${API_ENDPOINTS.REPORTS_FINANCIAL}?year=${year}`),

  topCustomers: (limit = 5): Promise<TopCustomer[]> =>
    apiClient<TopCustomer[]>(`${API_ENDPOINTS.REPORTS_TOP_CUSTOMERS}?limit=${limit}`),
}
