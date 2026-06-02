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
  error?: string
}

export const RecipientInput = ({
  recipients,
  onAdd,
  onRemove,
  error,
}: RecipientInputProps): JSX.Element => {
  const { customerOptions, isLoading, onSearch, onCustomerSelect, onFreeTextEmail, autocompleteValue } =
    useRecipientInput({ recipients, onAdd, onRemove })

  return (
    <div className={styles.container}>
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
