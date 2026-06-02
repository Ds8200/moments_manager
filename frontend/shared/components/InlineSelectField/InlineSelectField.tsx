'use client'
import type { ReactElement } from 'react'
import { useInlineSelectField } from './useInlineSelectField'
import type { InlineSelectFieldProps } from './useInlineSelectField'
import styles from './InlineSelectField.module.scss'

export const InlineSelectField = (props: InlineSelectFieldProps): ReactElement => {
  const { label, value, options, onChange } = useInlineSelectField(props)

  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
