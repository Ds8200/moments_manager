'use client'
import type { ReactNode } from 'react'

export interface DetailField {
  label: string
  value: ReactNode
  span?: 1 | 2
}

export interface DetailSection {
  title?: string
  fields: DetailField[]
}

export interface DetailLayoutProps {
  title: string
  backLabel: string
  onBack: () => void
  editLabel?: string
  onEdit?: () => void
  deleteLabel?: string
  onDelete?: () => void
  sections: DetailSection[]
  isLoading: boolean
  isError: boolean
  errorMessage: string
  children?: ReactNode
}

export interface UseDetailLayoutReturn {
  title: string
  backLabel: string
  onBack: () => void
  editLabel?: string
  onEdit?: () => void
  deleteLabel?: string
  onDelete?: () => void
  sections: DetailSection[]
  isLoading: boolean
  isError: boolean
  errorMessage: string
  children?: ReactNode
}

export const useDetailLayout = (props: DetailLayoutProps): UseDetailLayoutReturn => props
