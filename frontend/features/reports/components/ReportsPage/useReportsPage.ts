'use client'
import { useState, type MouseEvent } from 'react'
import { useFinancialReport, useTopCustomers } from '../../queries/useReports'
import { formatCurrency } from '@/shared/utils/formatters'
import { exportToExcel, exportToPrint } from '@/shared/utils/exportUtils'
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

const EXCEL_HEADERS = [
  REPORTS_LABELS.COL_MONTH,
  REPORTS_LABELS.COL_PAID_ORDERS,
  REPORTS_LABELS.COL_UNPAID_ORDERS,
  REPORTS_LABELS.COL_TOTAL_ORDERS,
  REPORTS_LABELS.COL_CASH,
  REPORTS_LABELS.COL_TRANSFER,
  REPORTS_LABELS.COL_UNPAID_AMOUNT,
  REPORTS_LABELS.COL_PAID_REVENUE,
  REPORTS_LABELS.COL_EXPENSES,
  REPORTS_LABELS.COL_PROFIT,
]

export const useReportsPage = (): UseReportsPageReturn => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const { data: financial, isLoading } = useFinancialReport(year)
  const { data: topCustomers } = useTopCustomers(5)
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i)

  const getMonthName = (monthIndex: number): string => HEBREW_MONTHS[monthIndex - 1] ?? ''

  const buildRows = (): (string | number)[][] => {
    if (!financial) return []
    return financial.months.map((m) => [
      getMonthName(m.month),
      m.paid_count,
      m.unpaid_count,
      m.total_count,
      formatCurrency(m.cash_revenue),
      formatCurrency(m.transfer_revenue),
      formatCurrency(m.unpaid_amount),
      formatCurrency(m.paid_revenue),
      formatCurrency(m.total_expenses),
      formatCurrency(m.total_profit),
    ])
  }

  const exportItems: DropdownMenuItem[] = [
    {
      label: REPORTS_LABELS.EXPORT_EXCEL,
      icon: '📊',
      onClick: () => {
        exportToExcel({
          filename: `reports-${year}`,
          headers: EXCEL_HEADERS,
          rows: buildRows(),
        })
      },
    },
    {
      label: REPORTS_LABELS.EXPORT_PDF,
      icon: '📄',
      onClick: () => {
        exportToPrint({
          title: `${REPORTS_LABELS.MONTHLY_TITLE} ${year}`,
          headers: EXCEL_HEADERS,
          rows: buildRows(),
        })
      },
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
    getMonthName,
    menuState,
    closeMenu,
    handleExportClick,
  }
}
