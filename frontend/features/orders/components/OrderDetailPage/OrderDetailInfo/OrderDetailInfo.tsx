'use client'
import type { ReactElement } from 'react'
import { useOrderDetailInfo } from './useOrderDetailInfo'
import { InlineEditField } from '@/shared/components/InlineEditField/InlineEditField'
import { InlineSelectField } from '@/shared/components/InlineSelectField/InlineSelectField'
import styles from './OrderDetailInfo.module.scss'
import type { OrderDetailInfoProps } from './useOrderDetailInfo'
import type { OrderStatus, PaymentState } from '@/shared/enums/statusEnums'
import type { UrgencyLevel } from '../../../types'

export const OrderDetailInfo = (props: OrderDetailInfoProps): ReactElement => {
  const {
    customerName,
    rawDate,
    formattedDate,
    rawDueDatetime,
    formattedDue,
    formattedAmount,
    currentStatus,
    currentPaymentState,
    currentUrgency,
    statusOptions,
    paymentOptions,
    urgencyOptions,
    onSaveDate,
    onSaveDueDatetime,
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
          <InlineEditField label={labelDate} value={rawDate} displayValue={formattedDate} type="date" editable onSave={onSaveDate} />
          <InlineEditField label={labelDue} value={rawDueDatetime} displayValue={formattedDue} type="datetime-local" editable onSave={onSaveDueDatetime} />
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
