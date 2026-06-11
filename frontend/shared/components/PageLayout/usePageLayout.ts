'use client'
import type { ReactNode } from 'react'
import type { FiltersBarProps } from '@/shared/components/FiltersBar/useFiltersBar'

export interface PageLayoutProps {
  title: string
  actionLabel?: string
  onAction?: () => void
  filtersBarProps?: FiltersBarProps
  children: ReactNode
}

export interface UsePageLayoutReturn {
  title: string
  actionLabel?: string
  onAction?: () => void
  filtersBarProps?: FiltersBarProps
  children: ReactNode
}

export const usePageLayout = (props: PageLayoutProps): UsePageLayoutReturn => props
