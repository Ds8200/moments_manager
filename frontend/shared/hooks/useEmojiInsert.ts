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
  buttonRef: RefObject<HTMLButtonElement | null>
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
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const togglePicker = useCallback(() => setIsPickerOpen((v) => !v), [])
  const closePicker = useCallback(() => setIsPickerOpen(false), [])

  const onEmojiSelect = useCallback(
    (rawEmoji: string) => {
      // Strip Variation Selector-16 using explicit unicode escape — literal
      // U+FE0F in source gets mangled by some tools; the escape is reliable.
      const emoji = rawEmoji.replace(/️/g, '')

      const el = textareaRef.current
      const current = String(getValues(fieldName) ?? '')

      const start = el?.selectionStart ?? current.length
      const end = el?.selectionEnd ?? current.length

      const next = current.slice(0, start) + emoji + current.slice(end)

      setValue(fieldName, next as T[Path<T>], {
        shouldValidate: true,
        shouldDirty: true,
      })

      setIsPickerOpen(false)

      // Use emoji.length (UTF-16 code units) — NOT [...emoji].length (code points).
      // setSelectionRange counts UTF-16 code units, just like selectionStart.
      // Supplementary-plane emojis (😊, 👍, …) are 2 code units / 1 code point,
      // so using code-point length would place the cursor inside a surrogate pair,
      // causing the next keystroke to insert a replacement character (U+FFFD "?").
      requestAnimationFrame(() => {
        if (!el) return
        el.focus()
        const pos = start + emoji.length
        el.setSelectionRange(pos, pos)
      })
    },
    [fieldName, getValues, setValue],
  )

  return { textareaRef, buttonRef, isPickerOpen, togglePicker, closePicker, onEmojiSelect }
}
