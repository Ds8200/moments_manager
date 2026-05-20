'use client'
import { useState } from 'react'
import { useFinancialReport, useTopCustomers } from '../../queries/useReports'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { formatCurrency } from '@/shared/utils/formatters'
import styles from './ReportsPage.module.scss'

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

const LABELS = {
  TITLE:           'דוחות',
  ANNUAL_REVENUE:  'הכנסות שנתיות',
  ANNUAL_PROFIT:   'רווח גולמי שנתי',
  ANNUAL_EXPENSES: 'הוצאות שנתיות',
  ANNUAL_NET:      'רווח נקי שנתי',
  MONTHLY_TITLE:   'סיכום חודשי',
  COL_MONTH:       'חודש',
  COL_REVENUE:     'הכנסות',
  COL_EXPENSES:    'הוצאות',
  COL_PROFIT:      'רווח',
  COL_ORDERS:      'הזמנות',
  TOP_CUSTOMERS:   'לקוחות מובילים',
  COL_CUSTOMER:    'לקוח',
  COL_ORDERS2:     'הזמנות',
  COL_REVENUE2:    'הכנסות',
} as const

export function ReportsPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const { data: financial, isLoading } = useFinancialReport(year)
  const { data: topCustomers } = useTopCustomers(5)

  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i)

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{LABELS.TITLE}</h1>
        <select
          className={styles.yearSelect}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {isLoading && <PageSkeleton rows={4} />}

      {financial && (
        <>
          <div className={styles.kpiRow}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{LABELS.ANNUAL_REVENUE}</span>
              <span className={styles.kpiValue}>{formatCurrency(financial.annual_revenue)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{LABELS.ANNUAL_PROFIT}</span>
              <span className={`${styles.kpiValue} ${styles.kpiPositive}`}>{formatCurrency(financial.annual_profit)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{LABELS.ANNUAL_EXPENSES}</span>
              <span className={`${styles.kpiValue} ${styles.kpiNegative}`}>{formatCurrency(financial.annual_expenses)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{LABELS.ANNUAL_NET}</span>
              <span className={`${styles.kpiValue} ${parseFloat(financial.annual_net) >= 0 ? styles.kpiPositive : styles.kpiNegative}`}>
                {formatCurrency(financial.annual_net)}
              </span>
            </div>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableTitle}>{LABELS.MONTHLY_TITLE} {year}</div>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>{LABELS.COL_MONTH}</th>
                  <th>{LABELS.COL_REVENUE}</th>
                  <th>{LABELS.COL_EXPENSES}</th>
                  <th>{LABELS.COL_PROFIT}</th>
                  <th>{LABELS.COL_ORDERS}</th>
                </tr>
              </thead>
              <tbody>
                {financial.months.map((m) => (
                  <tr key={m.month} className={styles.row}>
                    <td className={`${styles.cell} ${styles.monthName}`}>
                      {HEBREW_MONTHS[m.month - 1]}
                    </td>
                    <td className={styles.cell}>{formatCurrency(m.total_revenue)}</td>
                    <td className={styles.cell}>{formatCurrency(m.total_expenses)}</td>
                    <td className={`${styles.cell} ${styles.profit}`}>{formatCurrency(m.total_profit)}</td>
                    <td className={styles.cell}>{m.order_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {topCustomers && topCustomers.length > 0 && (
        <div className={styles.tableCard}>
          <div className={styles.tableTitle}>{LABELS.TOP_CUSTOMERS}</div>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>{LABELS.COL_CUSTOMER}</th>
                <th>{LABELS.COL_ORDERS2}</th>
                <th>{LABELS.COL_REVENUE2}</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c) => (
                <tr key={c.customer_id} className={styles.row}>
                  <td className={`${styles.cell} ${styles.topCustomerName}`}>{c.customer_name}</td>
                  <td className={styles.cell}>{c.order_count}</td>
                  <td className={styles.cell}>{formatCurrency(c.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
