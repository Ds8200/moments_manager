'use client'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../api'

export const useMonthlyReport = (year: number, month: number) =>
  useQuery({
    queryKey: ['reports', 'monthly', year, month],
    queryFn: () => reportsApi.monthly(year, month),
  })

export const useFinancialReport = (year: number) =>
  useQuery({
    queryKey: ['reports', 'financial', year],
    queryFn: () => reportsApi.financial(year),
  })

export const useTopCustomers = (limit = 5) =>
  useQuery({
    queryKey: ['reports', 'top-customers', limit],
    queryFn: () => reportsApi.topCustomers(limit),
  })
