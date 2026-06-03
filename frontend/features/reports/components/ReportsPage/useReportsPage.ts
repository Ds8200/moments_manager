'use client'
import { useState } from 'react'
import { useFinancialReport, useTopCustomers } from '../../queries/useReports'
import { formatCurrency } from '@/shared/utils/formatters'
import { HEBREW_MONTHS } from '../../constants/reportsLabels'
import type { FinancialReport, TopCustomer } from '../../types'

export interface UseReportsPageReturn {
  year: number
  setYear: (y: number) => void
  yearOptions: number[]
  financial: FinancialReport | undefined
  topCustomers: TopCustomer[] | undefined
  isLoading: boolean
  formatAmount: (v: string | number) => string
  formatRate: (v: number) => string
  getMonthName: (monthIndex: number) => string
}

export const useReportsPage = (): UseReportsPageReturn => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const { data: financial, isLoading } = useFinancialReport(year)
  const { data: topCustomers } = useTopCustomers(5)

  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i)

  return {
    year,
    setYear,
    yearOptions,
    financial,
    topCustomers,
    isLoading,
    formatAmount: formatCurrency,
    formatRate: (v: number): string => `${v.toFixed(1)}%`,
    getMonthName: (monthIndex: number) => HEBREW_MONTHS[monthIndex - 1] ?? '',
  }
}
