'use client'
import type { JSX } from 'react'
import { SEND_EMAIL_LABELS } from '../../../constants/sendEmailLabels'
import { useRecipientInput } from './useRecipientInput'
import type { Customer } from '@/features/customers/types'
import type { Recipient } from '../../../types'
import styles from './RecipientInput.module.scss'

export interface RecipientInputProps {
  recipients: Recipient[]
  onToggle: (customer: Customer) => void
  onSelectAll: (customers: Customer[]) => void
  onClearAll: () => void
  error?: string
}

export const RecipientInput = ({
  recipients,
  onToggle,
  onSelectAll,
  onClearAll,
  error,
}: RecipientInputProps): JSX.Element => {
  const {
    customers,
    isLoading,
    isCustomerSelected,
    isAllSelected,
    selectAllRef,
    onToggle: handleToggle,
    onSelectAll: handleSelectAll,
    onClearAll: handleClearAll,
  } = useRecipientInput({ recipients, onToggle, onSelectAll, onClearAll })

  return (
    <div className={styles.container}>
      <span className={styles.label}>{SEND_EMAIL_LABELS.RECIPIENTS_LABEL}</span>
      {error && <span className={styles.error}>{error}</span>}
      <div className={styles.listBox}>
        <div className={styles.headerRow}>
          <input
            type="checkbox"
            id="recipient-select-all"
            ref={selectAllRef}
            checked={isAllSelected}
            onChange={isAllSelected ? handleClearAll : handleSelectAll}
            disabled={isLoading || customers.length === 0}
          />
          <label htmlFor="recipient-select-all" className={styles.headerLabel}>
            {SEND_EMAIL_LABELS.SELECT_ALL}
          </label>
        </div>
        {customers.map((c) => (
          <label key={c.id} className={styles.row}>
            <input
              type="checkbox"
              checked={isCustomerSelected(c.id)}
              onChange={() => handleToggle(c)}
            />
            <span className={styles.name}>{c.name}</span>
            <span className={styles.email}>{c.email}</span>
          </label>
        ))}
        {!isLoading && customers.length === 0 && (
          <span className={styles.empty}>{SEND_EMAIL_LABELS.NO_CUSTOMERS_WITH_EMAIL}</span>
        )}
      </div>
    </div>
  )
}
