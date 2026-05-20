import type { ReactElement } from 'react'
import styles from './StatusBadge.module.scss'
import { STATUS_LABELS } from '@/shared/enums/statusEnums'
import type { OrderStatus } from '@/shared/enums/statusEnums'

interface StatusBadgeProps {
  status: OrderStatus
}

export const StatusBadge = ({ status }: StatusBadgeProps): ReactElement => {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
