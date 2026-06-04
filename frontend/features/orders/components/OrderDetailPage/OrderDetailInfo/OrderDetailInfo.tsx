'use client'
import type { ReactElement } from 'react'
import { useOrderDetailInfo } from './useOrderDetailInfo'
import { InlineSelectField } from '@/shared/components/InlineSelectField/InlineSelectField'
import styles from './OrderDetailInfo.module.scss'
import type { OrderDetailInfoProps } from './useOrderDetailInfo'
import type { OrderStatus, PaymentState } from '@/shared/enums/statusEnums'
import type { UrgencyLevel } from '../../../types'

export const OrderDetailInfo = (props: OrderDetailInfoProps): ReactElement => {
  const {
    customerName,
    formattedDate,
    formattedDue,
    formattedAmount,
    currentStatus,
    currentPaymentState,
    currentUrgency,
    statusOptions,
    paymentOptions,
    urgencyOptions,
    onStatusChange,
    onPaymentChange,
    onUrgencyChange,
    sectionTitle,
    labelCustomer,
    labelDate,
    labelDue,
    labelAmount,
    labelStatus,
    labelUrgency,
    labelPayment,
  } = useOrderDetailInfo(props)

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>{labelCustomer}</span>
          <span className={styles.cardValue}>{customerName}</span>
        </div>
        <div className={styles.card}>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>{labelDate}</span>
            <span className={styles.metaValue}>{formattedDate}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>{labelDue}</span>
            <span className={styles.metaValue}>{formattedDue}</span>
          </div>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>{labelAmount}</span>
          <span className={styles.cardValueLarge}>{formattedAmount}</span>
        </div>
      </div>
      <div className={styles.selects}>
        <InlineSelectField
          label={labelStatus}
          value={currentStatus}
          options={statusOptions}
          onChange={(v) => onStatusChange(v as OrderStatus)}
        />
        <InlineSelectField
          label={labelUrgency}
          value={currentUrgency}
          options={urgencyOptions}
          onChange={(v) => onUrgencyChange(v as UrgencyLevel)}
        />
        <InlineSelectField
          label={labelPayment}
          value={currentPaymentState}
          options={paymentOptions}
          onChange={(v) => onPaymentChange(v as PaymentState)}
        />
      </div>
    </section>
  )
}
