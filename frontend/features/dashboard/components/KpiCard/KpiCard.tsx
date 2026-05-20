import type { ReactElement } from 'react'
import styles from './KpiCard.module.scss'

export interface KpiCardProps {
  label: string
  value: string | number
  icon: string
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

export const KpiCard = ({ label, value, icon, color = 'default' }: KpiCardProps): ReactElement => {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <span className={styles.icon}>{icon}</span>
      <div className={styles.body}>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  )
}
