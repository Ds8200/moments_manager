'use client'
import { useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'

export type InlineEditFieldType = 'text' | 'number' | 'date' | 'datetime-local' | 'textarea'

export interface InlineEditFieldProps {
  label: string
  value: string
  // Optional prettier read-only rendering (e.g. a localized date) — falls back to `value`.
  // The input itself always edits the raw `value` (native date/number inputs need that format).
  displayValue?: string
  type: InlineEditFieldType
  editable: boolean
  onSave: (value: string) => void
}

export interface UseInlineEditFieldReturn {
  label: string
  displayValue: string
  type: InlineEditFieldType
  editable: boolean
  isEditing: boolean
  draft: string
  onStartEdit: () => void
  onDraftChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onBlur: () => void
}

export const useInlineEditField = (props: InlineEditFieldProps): UseInlineEditFieldReturn => {
  const { label, value, displayValue, type, editable, onSave } = props
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const onStartEdit = (): void => {
    if (!editable) return
    setDraft(value)
    setIsEditing(true)
  }

  const onDraftChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setDraft(e.target.value)
  }

  const commit = (): void => {
    setIsEditing(false)
    if (draft !== value) onSave(draft)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsEditing(false)
    }
  }

  const onBlur = (): void => setIsEditing(false)

  // An empty value would render as a blank, zero-width span — nothing to see and nothing to
  // double-click to start editing. Show a placeholder instead so an empty editable field is
  // always visible and reachable.
  const resolvedDisplayValue = displayValue ?? value
  const shownValue = resolvedDisplayValue === '' ? UI_SYMBOLS.EM_DASH : resolvedDisplayValue

  return {
    label,
    displayValue: shownValue,
    type,
    editable,
    isEditing,
    draft,
    onStartEdit,
    onDraftChange,
    onKeyDown,
    onBlur,
  }
}
