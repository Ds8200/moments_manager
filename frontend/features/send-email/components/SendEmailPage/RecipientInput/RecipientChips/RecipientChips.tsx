'use client'
import type { JSX } from 'react'
import { useRecipientChips } from './useRecipientChips'
import type { RecipientChipsProps } from './useRecipientChips'
import { SEND_EMAIL_LABELS } from '../../../../constants/sendEmailLabels'
import styles from './RecipientChips.module.scss'

export const RecipientChips = ({ recipients, onRemove }: RecipientChipsProps): JSX.Element => {
  const { recipients: list, onRemove: handleRemove } = useRecipientChips({ recipients, onRemove })

  return (
    <ul className={styles.list}>
      {list.map((r) => (
        <li key={r.key} className={styles.chip}>
          <span className={styles.label}>{r.label}</span>
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => handleRemove(r.key)}
            aria-label={`${SEND_EMAIL_LABELS.REMOVE_RECIPIENT} ${r.label}`}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}
