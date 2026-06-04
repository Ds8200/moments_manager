'use client'
import type { JSX } from 'react'
import { useAttachmentChips } from './useAttachmentChips'
import type { AttachmentChipsProps } from './useAttachmentChips'
import { SEND_EMAIL_LABELS } from '../../../constants/sendEmailLabels'
import styles from './AttachmentChips.module.scss'

export const AttachmentChips = ({ files, onRemove }: AttachmentChipsProps): JSX.Element => {
  const { files: fileList, onRemove: handleRemove } = useAttachmentChips({ files, onRemove })

  return (
    <ul className={styles.list} aria-label={SEND_EMAIL_LABELS.ATTACH_FILE}>
      {fileList.map((file, index) => (
        <li key={`${file.name}-${file.size}`} className={styles.chip}>
          <svg
            className={styles.fileIcon}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span className={styles.chipName}>{file.name}</span>
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => handleRemove(index)}
            aria-label={SEND_EMAIL_LABELS.REMOVE_FILE}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}
