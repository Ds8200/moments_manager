'use client'
import type { ReactElement } from 'react'
import { useFiltersBar } from './useFiltersBar'
import type { FiltersBarProps } from './useFiltersBar'
import { FiltersBarControls } from './FiltersBarControls/FiltersBarControls'
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
    hasCollapsibleControls,
    isExpanded,
    toggleExpanded,
    activeCount,
    filtersToggleLabel,
  } = useFiltersBar(props)

  return (
    <div className={styles.wrap}>
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

      {hasCollapsibleControls && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={isExpanded}
          onClick={toggleExpanded}
        >
          <span>{filtersToggleLabel}</span>
          {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
          <svg
            className={styles.chevron}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {hasCollapsibleControls && (
        <FiltersBarControls
          isExpanded={isExpanded}
          selects={selects}
          showDates={showDates}
          dateFrom={dateFrom}
          dateTo={dateTo}
          dateFromLabel={dateFromLabel}
          dateToLabel={dateToLabel}
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
        />
      )}
    </div>
  )
}
