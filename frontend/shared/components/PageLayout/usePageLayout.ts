'use client'
import type { ReactNode } from 'react'

export interface PageLayoutProps {
  title: string
  actionLabel?: string
  onAction?: () => void
  actions?: ReactNode
  filters?: ReactNode
  // When true, the content area scrolls normally (overflow-y: auto) instead of staying
  // hidden — for free-flowing pages (e.g. Reports) where children don't manage their own
  // internal scroll the way DataTable does for the list pages. Defaults to false so existing
  // table pages are unaffected.
  scrollContent?: boolean
  children: ReactNode
}

export interface UsePageLayoutReturn {
  title: string
  showAction: boolean
  actionLabel: string
  onAction: () => void
  actions?: ReactNode
  filters?: ReactNode
  scrollContent: boolean
  children: ReactNode
}

const noop = (): void => undefined

export const usePageLayout = (props: PageLayoutProps): UsePageLayoutReturn => {
  const { title, actionLabel, onAction, actions, filters, scrollContent, children } = props

  return {
    title,
    showAction: Boolean(actionLabel && onAction),
    actionLabel: actionLabel ?? '',
    onAction: onAction ?? noop,
    actions,
    filters,
    scrollContent: scrollContent ?? false,
    children,
  }
}
