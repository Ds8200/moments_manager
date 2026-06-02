'use client'
import type { JSX } from 'react'
import { useToastContainer } from './useToastContainer'
import { ToastItem } from './ToastItem/ToastItem'
import styles from './ToastContainer.module.scss'

export const ToastContainer = (): JSX.Element => {
  const { toasts, regionLabel } = useToastContainer()

  return (
    <div className={styles.region} role="region" aria-label={regionLabel}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
