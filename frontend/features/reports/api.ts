'use client'
import { apiClient, ApiError } from '@/shared/utils/apiClient'
import { downloadBlob } from '@/shared/utils/exportUtils'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { MonthlyReport, FinancialReport, TopCustomer } from './types'

async function downloadFromApi(url: string, filename: string): Promise<void> {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') ?? '') : ''
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new ApiError(res.status, 'שגיאה בייצוא הקובץ')
  const blob = await res.blob()
  downloadBlob(blob, filename)
}

export const reportsApi = {
  monthly: (year: number, month: number): Promise<MonthlyReport> =>
    apiClient<MonthlyReport>(`${API_ENDPOINTS.REPORTS_MONTHLY}?year=${year}&month=${month}`),

  financial: (year: number): Promise<FinancialReport> =>
    apiClient<FinancialReport>(`${API_ENDPOINTS.REPORTS_FINANCIAL}?year=${year}`),

  topCustomers: (limit = 5): Promise<TopCustomer[]> =>
    apiClient<TopCustomer[]>(`${API_ENDPOINTS.REPORTS_TOP_CUSTOMERS}?limit=${limit}`),

  exportExcel: (year: number): Promise<void> =>
    downloadFromApi(`${API_ENDPOINTS.REPORTS_EXPORT_EXCEL}?year=${year}`, `reports-${year}.xlsx`),

  exportPdf: (year: number): Promise<void> =>
    downloadFromApi(`${API_ENDPOINTS.REPORTS_EXPORT_PDF}?year=${year}`, `reports-${year}.pdf`),
}
