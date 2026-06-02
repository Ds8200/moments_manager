'use client'
import { useRef, useState, useCallback } from 'react'
import type { RefObject } from 'react'
import type {
  FieldValues,
  Path,
  UseFormGetValues,
  UseFormSetValue,
} from 'react-hook-form'

export interface UseEmojiInsertReturn {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  isPickerOpen: boolean
  togglePicker: () => void
  closePicker: () => void
  onEmojiSelect: (emoji: string) => void
}

export const useEmojiInsert = <T extends FieldValues>(
  fieldName: Path<T>,
  getValues: UseFormGetValues<T>,
  setValue: UseFormSetValue<T>,
): UseEmojiInsertReturn => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const togglePicker = useCallback(() => setIsPickerOpen((v) => !v), [])
  const closePicker = useCallback(() => setIsPickerOpen(false), [])

  const onEmojiSelect = useCallback(
    (rawEmoji: string) => {
      const emoji = rawEmoji.replace(/️/g, '') // strip any residual VS-16
      const el = textareaRef.current
      const current = String(getValues(fieldName) ?? '')

      const start = el?.selectionStart ?? current.length
      const end = el?.selectionEnd ?? current.length

      const next = current.slice(0, start) + emoji + current.slice(end)

      // shouldDirty + shouldValidate keeps RHF in sync
      setValue(fieldName, next as T[Path<T>], {
        shouldValidate: true,
        shouldDirty: true,
      })

      setIsPickerOpen(false)

      // Restore focus and cursor after React re-renders the controlled value.
      // [...emoji].length counts Unicode code points, not UTF-16 code units,
      // so surrogate-pair emojis don't mis-advance the cursor.
      requestAnimationFrame(() => {
        if (!el) return
        el.focus()
        const pos = start + [...emoji].length
        el.setSelectionRange(pos, pos)
      })
    },
    [fieldName, getValues, setValue],
  )

  return { textareaRef, isPickerOpen, togglePicker, closePicker, onEmojiSelect }
}
