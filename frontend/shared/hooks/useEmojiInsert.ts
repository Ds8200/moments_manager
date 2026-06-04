'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import type { RefObject } from 'react'
import type {
  FieldValues,
  Path,
  UseFormGetValues,
  UseFormSetValue,
} from 'react-hook-form'

export interface UseEmojiInsertReturn {
  subjectRef: RefObject<HTMLInputElement | null>
  subjectCallbackRef: (el: HTMLInputElement | null) => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
  textareaCallbackRef: (el: HTMLTextAreaElement | null) => void
  buttonRef: RefObject<HTMLButtonElement | null>
  anchorRef: RefObject<HTMLElement | null>
  isPickerOpen: boolean
  togglePicker: () => void
  closePicker: () => void
  onEmojiSelect: (emoji: string) => void
  onSubjectFocus: () => void
  onBodyFocus: () => void
}

export const useEmojiInsert = <T extends FieldValues>(
  subjectFieldName: Path<T>,
  bodyFieldName: Path<T>,
  getValues: UseFormGetValues<T>,
  setValue: UseFormSetValue<T>,
): UseEmojiInsertReturn => {
  const subjectRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const anchorRef = useRef<HTMLElement>(null)

  // Expose setters so callers can register inputs without mutating returned ref
  // objects directly (which triggers react-hooks/immutability).
  const subjectCallbackRef = useCallback((el: HTMLInputElement | null) => {
    subjectRef.current = el
  }, [])
  const textareaCallbackRef = useCallback((el: HTMLTextAreaElement | null) => {
    textareaRef.current = el
    // Keep anchorRef in sync when textarea mounts/remounts (e.g. dialog re-open).
    // body is the initial activeField, so the textarea IS the default anchor.
    // The useEffect below re-syncs anchorRef on focus changes.
    if (el !== null) {
      anchorRef.current = el as HTMLElement
    }
  }, [])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [activeField, setActiveField] = useState<'subject' | 'body'>('body')

  const onSubjectFocus = useCallback(() => setActiveField('subject'), [])
  const onBodyFocus = useCallback(() => setActiveField('body'), [])

  // Keep anchorRef pointing to whichever field is focused
  useEffect(() => {
    anchorRef.current =
      activeField === 'subject'
        ? (subjectRef.current as HTMLElement | null)
        : (textareaRef.current as HTMLElement | null)
  }, [activeField])

  const togglePicker = useCallback(() => setIsPickerOpen((v) => !v), [])
  const closePicker = useCallback(() => setIsPickerOpen(false), [])

  const onEmojiSelect = useCallback(
    (rawEmoji: string) => {
      const emoji = rawEmoji

      if (activeField === 'subject') {
        const el = subjectRef.current
        const current = String(getValues(subjectFieldName) ?? '')
        const start = el?.selectionStart ?? current.length
        const end = el?.selectionEnd ?? current.length
        const next = current.slice(0, start) + emoji + current.slice(end)
        setValue(subjectFieldName, next as T[Path<T>], {
          shouldValidate: true,
          shouldDirty: true,
        })
        requestAnimationFrame(() => {
          if (!el) return
          el.focus()
          const pos = start + emoji.length
          el.setSelectionRange(pos, pos)
        })
      } else {
        const el = textareaRef.current
        const current = String(getValues(bodyFieldName) ?? '')
        const start = el?.selectionStart ?? current.length
        const end = el?.selectionEnd ?? current.length
        const next = current.slice(0, start) + emoji + current.slice(end)
        setValue(bodyFieldName, next as T[Path<T>], {
          shouldValidate: true,
          shouldDirty: true,
        })
        // Use emoji.length (UTF-16 code units) — NOT [...emoji].length (code points).
        // setSelectionRange counts UTF-16 code units, just like selectionStart.
        // Supplementary-plane emojis (😊, 👍, …) are 2 code units / 1 code point,
        // so using code-point length would place the cursor inside a surrogate pair.
        requestAnimationFrame(() => {
          if (!el) return
          el.focus()
          const pos = start + emoji.length
          el.setSelectionRange(pos, pos)
        })
      }
      // Picker intentionally stays open — user may want to insert multiple emojis.
    },
    [activeField, subjectFieldName, bodyFieldName, getValues, setValue],
  )

  return {
    subjectRef,
    subjectCallbackRef,
    textareaRef,
    textareaCallbackRef,
    buttonRef,
    anchorRef,
    isPickerOpen,
    togglePicker,
    closePicker,
    onEmojiSelect,
    onSubjectFocus,
    onBodyFocus,
  }
}
