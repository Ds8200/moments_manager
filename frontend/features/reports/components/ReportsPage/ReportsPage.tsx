'use client'
import type { ReactElement } from 'react'
import { useReportsPage } from './useReportsPage'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { Button } from '@/shared/components/Button/Button'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import { REPORTS_LABELS } from '../../constants/reportsLabels'
import styles from './ReportsPage.module.scss'

export const ReportsPage = (): ReactElement => {
  const {
    year, setYear, yearOptions, financial, topCustomers, isLoading,
    formatAmount, formatRate, getMonthName,
    menuState, closeMenu, handleExportClick, isExporting,
  } = useReportsPage()

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{REPORTS_LABELS.PAGE_TITLE}</h1>
        <div className={styles.toolbarActions}>
          <select
            className={styles.yearSelect}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={handleExportClick} loading={isExporting}>
            {REPORTS_LABELS.EXPORT_BUTTON}
          </Button>
        </div>
      </div>

      {isLoading && <PageSkeleton rows={4} />}

      {financial && (
        <>
          <div className={styles.kpiRow}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{REPORTS_LABELS.ANNUAL_REVENUE}</span>
              <span className={styles.kpiValue}>{formatAmount(financial.annual_revenue)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{REPORTS_LABELS.ANNUAL_PROFIT}</span>
              <span className={`${styles.kpiValue} ${styles.kpiPositive}`}>{formatAmount(financial.annual_profit)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{REPORTS_LABELS.ANNUAL_EXPENSES}</span>
              <span className={`${styles.kpiValue} ${styles.kpiNegative}`}>{formatAmount(financial.annual_expenses)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{REPORTS_LABELS.ANNUAL_NET}</span>
              <span className={`${styles.kpiValue} ${parseFloat(financial.annual_net) >= 0 ? styles.kpiPositive : styles.kpiNegative}`}>
                {formatAmount(financial.annual_net)}
              </span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{REPORTS_LABELS.ANNUAL_UNPAID}</span>
              <span className={`${styles.kpiValue} ${styles.kpiNegative}`}>{formatAmount(financial.annual_unpaid)}</span>
            </div>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableTitle}>{REPORTS_LABELS.MONTHLY_TITLE} {year}</div>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th rowSpan={2} className={styles.thFirstCol}>{REPORTS_LABELS.COL_MONTH}</th>
                  <th colSpan={4} className={styles.thGroup}>{REPORTS_LABELS.GROUP_ORDERS}</th>
                  <th colSpan={4} className={styles.thGroup}>{REPORTS_LABELS.GROUP_PAYMENTS}</th>
                  <th colSpan={2} className={styles.thGroup}>{REPORTS_LABELS.GROUP_PROFIT}</th>
                </tr>
                <tr>
                  <th>{REPORTS_LABELS.COL_PAID_ORDERS}</th>
                  <th>{REPORTS_LABELS.COL_UNPAID_ORDERS}</th>
                  <th>{REPORTS_LABELS.COL_TOTAL_ORDERS}</th>
                  <th>{REPORTS_LABELS.COL_COLLECTION_RATE}</th>
                  <th>{REPORTS_LABELS.COL_CASH}</th>
                  <th>{REPORTS_LABELS.COL_TRANSFER}</th>
                  <th>{REPORTS_LABELS.COL_UNPAID_AMOUNT}</th>
                  <th>{REPORTS_LABELS.COL_PAID_REVENUE}</th>
                  <th>{REPORTS_LABELS.COL_EXPENSES}</th>
                  <th>{REPORTS_LABELS.COL_PROFIT}</th>
                </tr>
              </thead>
              <tbody>
                {financial.months.map((m) => (
                  <tr key={m.month} className={styles.row}>
                    <td className={`${styles.cell} ${styles.monthName}`}>{getMonthName(m.month)}</td>
                    <td className={styles.cell}>{m.paid_count}</td>
                    <td className={styles.cell}>{m.unpaid_count}</td>
                    <td className={styles.cell}>{m.total_count}</td>
                    <td className={styles.cell}>{formatRate(m.collection_rate)}</td>
                    <td className={styles.cell}>{formatAmount(m.cash_revenue)}</td>
                    <td className={styles.cell}>{formatAmount(m.transfer_revenue)}</td>
                    <td className={`${styles.cell} ${styles.kpiNegative}`}>{formatAmount(m.unpaid_amount)}</td>
                    <td className={`${styles.cell} ${styles.profit}`}>{formatAmount(m.paid_revenue)}</td>
                    <td className={styles.cell}>{formatAmount(m.total_expenses)}</td>
                    <td className={`${styles.cell} ${styles.profit}`}>{formatAmount(m.net_profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {topCustomers && topCustomers.length > 0 && (
        <div className={styles.tableCard}>
          <div className={styles.tableTitle}>{REPORTS_LABELS.TOP_CUSTOMERS}</div>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>{REPORTS_LABELS.COL_CUSTOMER}</th>
                <th>{REPORTS_LABELS.COL_ORDERS}</th>
                <th>{REPORTS_LABELS.COL_REVENUE}</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c) => (
                <tr key={c.customer_id} className={styles.row}>
                  <td className={`${styles.cell} ${styles.topCustomerName}`}>{c.customer_name}</td>
                  <td className={styles.cell}>{c.order_count}</td>
                  <td className={styles.cell}>{formatAmount(c.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DropdownMenu state={menuState} onClose={closeMenu} />
    </div>
  )
}
