'use client'
import type { ReactElement } from 'react'
import { useOrderDetailHeader } from './useOrderDetailHeader'
import styles from './OrderDetailHeader.module.scss'
import type { OrderDetailHeaderProps } from './useOrderDetailHeader'

export const OrderDetailHeader = (props: OrderDetailHeaderProps): ReactElement => {
  const {
    orderNumber,
    customerName,
    backLabel,
    editLabel,
    deleteLabel,
    onBack,
    onEdit,
    onDelete,
  } = useOrderDetailHeader(props)

  return (
    <div className={styles.header}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        {backLabel}
      </button>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>{orderNumber}</h1>
        {customerName && <span className={styles.customer}>{customerName}</span>}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.editBtn} onClick={onEdit}>
          {editLabel}
        </button>
        <button type="button" className={styles.deleteBtn} onClick={onDelete}>
          {deleteLabel}
        </button>
      </div>
    </div>
  )
}
