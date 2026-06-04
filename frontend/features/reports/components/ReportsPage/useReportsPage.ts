'use client'
import { useState, type MouseEvent } from 'react'
import { useFinancialReport, useTopCustomers } from '../../queries/useReports'
import { reportsApi } from '../../api'
import { formatCurrency } from '@/shared/utils/formatters'
import { useDropdownMenu, type DropdownMenuItem, type DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'
import { HEBREW_MONTHS, REPORTS_LABELS } from '../../constants/reportsLabels'
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
  menuState: DropdownMenuState
  closeMenu: () => void
  handleExportClick: (e: MouseEvent<HTMLButtonElement>) => void
}

export const useReportsPage = (): UseReportsPageReturn => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const { data: financial, isLoading } = useFinancialReport(year)
  const { data: topCustomers } = useTopCustomers(5)
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i)

  const exportItems: DropdownMenuItem[] = [
    {
      label: REPORTS_LABELS.EXPORT_EXCEL,
      icon: '📊',
      onClick: () => { reportsApi.exportExcel(year).catch(console.error) },
    },
    {
      label: REPORTS_LABELS.EXPORT_PDF,
      icon: '📄',
      onClick: () => { reportsApi.exportPdf(year).catch(console.error) },
    },
  ]

  const handleExportClick = (e: MouseEvent<HTMLButtonElement>): void => {
    openMenu(REPORTS_LABELS.EXPORT_DROPDOWN_TITLE, exportItems, e)
  }

  return {
    year,
    setYear,
    yearOptions,
    financial,
    topCustomers,
    isLoading,
    formatAmount: formatCurrency,
    formatRate: (v: number): string => `${v.toFixed(1)}%`,
    getMonthName: (monthIndex: number): string => HEBREW_MONTHS[monthIndex - 1] ?? '',
    menuState,
    closeMenu,
    handleExportClick,
  }
}
