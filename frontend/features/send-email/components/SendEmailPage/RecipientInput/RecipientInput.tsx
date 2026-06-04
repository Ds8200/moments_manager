'use client'
import type { JSX } from 'react'
import { SEND_EMAIL_LABELS } from '../../../constants/sendEmailLabels'
import { useRecipientInput } from './useRecipientInput'
import { RecipientChips } from './RecipientChips/RecipientChips'
import type { Customer } from '@/features/customers/types'
import type { Recipient } from '../../../types'
import styles from './RecipientInput.module.scss'

export interface RecipientInputProps {
  recipients: Recipient[]
  onToggle: (customer: Customer) => void
  onSelectAll: (customers: Customer[]) => void
  onClearAll: () => void
  onAddManual: (email: string) => void
  onRemoveRecipient: (key: string) => void
  error?: string
}

export const RecipientInput = (props: RecipientInputProps): JSX.Element => {
  const {
    customers, isLoading, isCustomerSelected, isAllSelected, selectAllRef,
    onToggle, onSelectAll, onClearAll, onRemoveRecipient,
    manualInput, onManualInputChange, onAddManual, onManualKeyDown, manualError,
    isListOpen, toggleList,
  } = useRecipientInput(props)

  const { recipients, error } = props

  return (
    <div className={styles.container}>
      <span className={styles.label}>{SEND_EMAIL_LABELS.RECIPIENTS_LABEL}</span>
      {error && <span className={styles.error}>{error}</span>}

      {recipients.length > 0 && <RecipientChips recipients={recipients} onRemove={onRemoveRecipient} />}

      <div className={styles.manualRow}>
        <input
          type="email"
          className={styles.manualInput}
          placeholder={SEND_EMAIL_LABELS.MANUAL_EMAIL_PLACEHOLDER}
          value={manualInput}
          onChange={(e) => onManualInputChange(e.target.value)}
          onKeyDown={onManualKeyDown}
          autoComplete="off"
        />
        <button type="button" className={styles.addBtn} onClick={onAddManual}>
          {SEND_EMAIL_LABELS.ADD_MANUAL_BTN}
        </button>
      </div>
      {manualError && <span className={styles.manualError}>{manualError}</span>}

      <button type="button" className={styles.listToggle} onClick={toggleList} aria-expanded={isListOpen}>
        <span>{SEND_EMAIL_LABELS.SHOW_LIST_BTN}</span>
        <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isListOpen && (
        <div className={styles.listBox}>
          <div className={styles.headerRow}>
            <input type="checkbox" id="recipient-select-all" ref={selectAllRef} checked={isAllSelected} onChange={isAllSelected ? onClearAll : onSelectAll} disabled={isLoading || customers.length === 0} />
            <label htmlFor="recipient-select-all" className={styles.headerLabel}>{SEND_EMAIL_LABELS.SELECT_ALL}</label>
          </div>
          {customers.map((c) => (
            <label key={c.id} className={styles.row}>
              <input type="checkbox" checked={isCustomerSelected(c.id)} onChange={() => onToggle(c)} />
              <span className={styles.name}>{c.name}</span>
              <span className={styles.email}>{c.email}</span>
            </label>
          ))}
          {!isLoading && customers.length === 0 && <span className={styles.empty}>{SEND_EMAIL_LABELS.NO_CUSTOMERS_WITH_EMAIL}</span>}
        </div>
      )}
    </div>
  )
}
