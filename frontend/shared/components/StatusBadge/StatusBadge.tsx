import styles from './StatusBadge.module.scss'
import { STATUS_LABELS } from '@/shared/enums/statusEnums'
import type { OrderStatus } from '@/shared/enums/statusEnums'

interface StatusBadgeProps {
  status: OrderStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
