'use client'
import type { ReactNode } from 'react'

export interface PageLayoutProps {
  title: string
  actionLabel?: string
  onAction?: () => void
  filters?: ReactNode
  children: ReactNode
}

export interface UsePageLayoutReturn {
  title: string
  showAction: boolean
  actionLabel: string
  onAction: () => void
  filters?: ReactNode
  children: ReactNode
}

const noop = (): void => undefined

export const usePageLayout = (props: PageLayoutProps): UsePageLayoutReturn => {
  const { title, actionLabel, onAction, filters, children } = props

  return {
    title,
    showAction: Boolean(actionLabel && onAction),
    actionLabel: actionLabel ?? '',
    onAction: onAction ?? noop,
    filters,
    children,
  }
}
