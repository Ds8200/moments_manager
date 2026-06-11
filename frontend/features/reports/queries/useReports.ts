'use client'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { reportsApi } from '../api'
import type { FinancialReport, MonthlyReport, TopCustomer } from '../types'

export const useMonthlyReport = (
  year: number,
  month: number,
): UseQueryResult<MonthlyReport> =>
  useQuery({
    queryKey: ['reports', 'monthly', year, month],
    queryFn: () => reportsApi.monthly(year, month),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

export const useFinancialReport = (year: number): UseQueryResult<FinancialReport> =>
  useQuery({
    queryKey: ['reports', 'financial', year],
    queryFn: () => reportsApi.financial(year),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

export const useTopCustomers = (limit = 5): UseQueryResult<TopCustomer[]> =>
  useQuery({
    queryKey: ['reports', 'top-customers', limit],
    queryFn: () => reportsApi.topCustomers(limit),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
