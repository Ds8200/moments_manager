'use client'
import type { ReactElement } from 'react'
import { useFiltersBar } from './useFiltersBar'
import type { FiltersBarProps } from './useFiltersBar'
import styles from './FiltersBar.module.scss'

export const FiltersBar = (props: FiltersBarProps): ReactElement => {
  const {
    searchValue,
    searchPlaceholder,
    onSearchChange,
    selects,
    showDates,
    dateFrom,
    dateTo,
    dateFromLabel,
    dateToLabel,
    onDateFromChange,
    onDateToChange,
  } = useFiltersBar(props)

  return (
    <div className={styles.bar}>
      <div className={styles.searchWrapper}>
        <i className={styles.searchIcon}>🔍</i>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {selects.map((sel, idx) => (
        <select
          key={idx}
          className={styles.select}
          value={sel.value}
          onChange={(e) => sel.onChange(e.target.value)}
        >
          {sel.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}

      {showDates && (
        <div className={styles.datesGroup}>
          <label className={styles.dateField}>
            {dateFromLabel && <span className={styles.dateLabel}>{dateFromLabel}</span>}
            <input
              type="date"
              className={styles.dateInput}
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </label>
          <label className={styles.dateField}>
            {dateToLabel && <span className={styles.dateLabel}>{dateToLabel}</span>}
            <input
              type="date"
              className={styles.dateInput}
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  )
}
