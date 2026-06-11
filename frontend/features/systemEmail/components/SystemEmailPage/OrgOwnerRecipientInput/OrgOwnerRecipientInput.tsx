'use client'
import type { JSX } from 'react'
import { useOrgOwnerRecipientInput } from './useOrgOwnerRecipientInput'
import { SYSTEM_EMAIL_LABELS } from '../../../constants/systemEmailLabels'
import type { OrgOwnerEmail, OrgOwnerRecipient } from '../../../types'
import styles from './OrgOwnerRecipientInput.module.scss'

export interface OrgOwnerRecipientInputProps {
  recipients: OrgOwnerRecipient[]
  onToggle: (owner: OrgOwnerEmail) => void
  onSelectAll: (owners: OrgOwnerEmail[]) => void
  onClearAll: () => void
  onAddManual: (email: string) => void
  onRemoveRecipient: (key: string) => void
  error?: string
}

export const OrgOwnerRecipientInput = (props: OrgOwnerRecipientInputProps): JSX.Element => {
  const {
    owners, isLoading, isOwnerSelected, isAllSelected, selectAllRef,
    onToggle, onSelectAll, onClearAll, onRemoveRecipient,
    manualInput, onManualInputChange, onAddManual, onManualKeyDown, manualError,
    isListOpen, toggleList,
  } = useOrgOwnerRecipientInput(props)

  const { recipients, error } = props

  return (
    <div className={styles.container}>
      <span className={styles.label}>{SYSTEM_EMAIL_LABELS.RECIPIENTS_LABEL}</span>
      {error && <span className={styles.error}>{error}</span>}

      {recipients.length > 0 && (
        <ul className={styles.chips}>
          {recipients.map((r) => (
            <li key={r.key} className={styles.chip}>
              <span>{r.label}</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => onRemoveRecipient(r.key)}
                aria-label={`${SYSTEM_EMAIL_LABELS.REMOVE_RECIPIENT} ${r.label}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.manualRow}>
        <input
          type="email"
          className={styles.manualInput}
          placeholder={SYSTEM_EMAIL_LABELS.MANUAL_EMAIL_PLACEHOLDER}
          value={manualInput}
          onChange={(e) => onManualInputChange(e.target.value)}
          onKeyDown={onManualKeyDown}
          autoComplete="off"
        />
        <button type="button" className={styles.addBtn} onClick={onAddManual}>
          {SYSTEM_EMAIL_LABELS.ADD_MANUAL_BTN}
        </button>
      </div>
      {manualError && <span className={styles.manualError}>{manualError}</span>}

      <button type="button" className={styles.listToggle} onClick={toggleList} aria-expanded={isListOpen}>
        <span>{SYSTEM_EMAIL_LABELS.SHOW_LIST_BTN}</span>
        <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isListOpen && (
        <div className={styles.listBox}>
          <div className={styles.headerRow}>
            <input type="checkbox" id="owner-select-all" ref={selectAllRef} checked={isAllSelected} onChange={isAllSelected ? onClearAll : onSelectAll} disabled={isLoading || owners.length === 0} />
            <label htmlFor="owner-select-all" className={styles.headerLabel}>{SYSTEM_EMAIL_LABELS.SELECT_ALL}</label>
          </div>
          {owners.map((o) => (
            <label key={o.user_id} className={styles.row}>
              <input type="checkbox" checked={isOwnerSelected(o.user_id)} onChange={() => onToggle(o)} />
              <span className={styles.name}>{o.full_name}</span>
              <span className={styles.orgName}>{o.org_name}</span>
              <span className={styles.email}>{o.email}</span>
            </label>
          ))}
          {!isLoading && owners.length === 0 && (
            <span className={styles.empty}>{SYSTEM_EMAIL_LABELS.NO_OWNERS}</span>
          )}
        </div>
      )}
    </div>
  )
}
