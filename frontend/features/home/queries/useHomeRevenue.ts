'use client'

import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { reportsApi } from '@/features/reports/api'
import type { FinancialReport } from '@/features/reports/types'

export const useHomeRevenue = (): UseQueryResult<FinancialReport> => {
  const year = new Date().getFullYear()
  return useQuery<FinancialReport>({
    queryKey: ['home', 'revenue', year],
    queryFn: () => reportsApi.financial(year),
    staleTime: 5 * 60 * 1000,
  })
}
