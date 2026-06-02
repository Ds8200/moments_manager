'use client'
import type { JSX } from 'react'
import { useToastItem } from './useToastItem'
import type { ToastItemProps } from './useToastItem'
import styles from './ToastItem.module.scss'

export const ToastItem = (props: ToastItemProps): JSX.Element => {
  const { message, typeClassName, ariaRole, closeLabel, onClose } = useToastItem(props)

  return (
    <div className={`${styles.toast} ${typeClassName}`} role={ariaRole}>
      <span className={styles.icon} aria-hidden="true" />
      <p className={styles.message}>{message}</p>
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label={closeLabel}
      />
    </div>
  )
}
