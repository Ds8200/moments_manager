'use client'
import type { ReactElement } from 'react'
import { useInlineEditField } from './useInlineEditField'
import type { InlineEditFieldProps } from './useInlineEditField'
import styles from './InlineEditField.module.scss'

export const InlineEditField = (props: InlineEditFieldProps): ReactElement => {
  const {
    label, displayValue, type, editable, isEditing, draft,
    onStartEdit, onDraftChange, onKeyDown, onBlur,
  } = useInlineEditField(props)

  return (
    <div className={`${styles.row} ${type === 'textarea' ? styles.full : ''}`}>
      {label && <span className={styles.label}>{label}</span>}
      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            className={styles.textarea}
            value={draft}
            autoFocus
            onChange={onDraftChange}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
          />
        ) : (
          <input
            type={type}
            className={styles.input}
            value={draft}
            autoFocus
            onChange={onDraftChange}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
          />
        )
      ) : (
        <span
          className={`${styles.value} ${editable ? styles.editable : ''}`}
          onDoubleClick={onStartEdit}
        >
          {displayValue}
        </span>
      )}
    </div>
  )
}
