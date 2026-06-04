'use client'
import type { JSX } from 'react'
import { Autocomplete } from '@/shared/components/Autocomplete/Autocomplete'
import { SEND_EMAIL_LABELS } from '../../../constants/sendEmailLabels'
import { useRecipientInput } from './useRecipientInput'
import type { Customer } from '@/features/customers/types'
import type { Recipient } from '../../../types'
import styles from './RecipientInput.module.scss'

export interface RecipientInputProps {
  recipients: Recipient[]
  onAdd: (r: Recipient) => void
  onRemove: (key: string) => void
  onAddAll: (rs: Recipient[]) => void
  onClearAll: () => void
  error?: string
}

export const RecipientInput = ({
  recipients,
  onAdd,
  onRemove,
  onAddAll,
  onClearAll,
  error,
}: RecipientInputProps): JSX.Element => {
  const {
    customerOptions,
    isLoading,
    onSearch,
    onCustomerSelect,
    onFreeTextEmail,
    autocompleteValue,
    onSelectAll,
    onClearAll: handleClearAll,
    isAllSelected,
    hasAnyRecipients,
  } = useRecipientInput({ recipients, onAdd, onRemove, onAddAll, onClearAll })

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onSelectAll}
          disabled={isAllSelected}
        >
          {SEND_EMAIL_LABELS.SELECT_ALL}
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleClearAll}
          disabled={!hasAnyRecipients}
        >
          {SEND_EMAIL_LABELS.CLEAR_ALL}
        </button>
      </div>
      <Autocomplete<Customer>
        value={autocompleteValue}
        onChange={onCustomerSelect}
        options={customerOptions}
        onSearch={onSearch}
        onFreeText={onFreeTextEmail}
        label={SEND_EMAIL_LABELS.RECIPIENTS_LABEL}
        placeholder={SEND_EMAIL_LABELS.RECIPIENTS_PLACEHOLDER}
        isLoading={isLoading}
        id="recipient-autocomplete"
        error={error}
      />
      {recipients.length > 0 && (
        <ul className={styles.chips}>
          {recipients.map((r) => (
            <li key={r.key} className={styles.chip}>
              <span className={styles.chipLabel}>{r.label}</span>
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => onRemove(r.key)}
                aria-label={SEND_EMAIL_LABELS.REMOVE_RECIPIENT}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
