'use client'
import type { ReactElement } from 'react'
import { useFiltersBarControls } from './useFiltersBarControls'
import type { FiltersBarControlsProps } from './useFiltersBarControls'
import styles from './FiltersBarControls.module.scss'

export const FiltersBarControls = (props: FiltersBarControlsProps): ReactElement => {
  const {
    selects,
    showDates,
    dateFrom,
    dateTo,
    dateFromLabel,
    dateToLabel,
    onDateFromChange,
    onDateToChange,
  } = useFiltersBarControls(props)

  return (
    <div className={styles.bar}>
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
