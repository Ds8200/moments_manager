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
    onDateFromChange,
    onDateToChange,
    newButtonLabel,
    onNew,
  } = useFiltersBar(props)

  return (
    <div className={styles.bar}>
      {/* Row 1: search + new button — always visible */}
      <div className={styles.primaryRow}>
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
        <button className={styles.newButton} onClick={onNew}>
          {newButtonLabel}
        </button>
      </div>

      {/* Row 2: selects — hidden when empty */}
      {selects.length > 0 && (
        <div className={styles.selectsRow}>
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
        </div>
      )}

      {/* Row 3: date inputs — hidden when not applicable */}
      {showDates && (
        <div className={styles.datesRow}>
          <input
            type="date"
            className={styles.dateInput}
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
          <input
            type="date"
            className={styles.dateInput}
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
