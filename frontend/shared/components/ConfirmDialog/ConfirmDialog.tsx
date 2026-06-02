'use client'
import type { JSX } from 'react'
import { useConfirmDialog } from './useConfirmDialog'
import styles from './ConfirmDialog.module.scss'

export const ConfirmDialog = (): JSX.Element => {
  const { isOpen, title, message, isDangerous, confirmLabel, cancelLabel, onConfirm, onCancel } =
    useConfirmDialog()

  return (
    <>
      {isOpen && (
        <div className={styles.backdrop} onClick={onCancel}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.message}>{message}</p>
            <div className={styles.actions}>
              <button type="button" className={styles.cancelButton} onClick={onCancel}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className={isDangerous ? styles.dangerButton : styles.confirmButton}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
