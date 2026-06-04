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
  openDirectionRef: RefObject<'below' | 'above'>
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
  const activeFieldRef = useRef<'subject' | 'body'>('body')
  const openDirectionRef = useRef<'below' | 'above'>('above')

  const subjectCallbackRef = useCallback((el: HTMLInputElement | null) => {
    subjectRef.current = el
  }, [])
  const textareaCallbackRef = useCallback((el: HTMLTextAreaElement | null) => {
    textareaRef.current = el
    if (el !== null) {
      anchorRef.current = el as HTMLElement
    }
  }, [])

  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const onSubjectFocus = useCallback(() => {
    activeFieldRef.current = 'subject'
    anchorRef.current = subjectRef.current as HTMLElement | null
    openDirectionRef.current = 'below'
  }, [])

  const onBodyFocus = useCallback(() => {
    activeFieldRef.current = 'body'
    anchorRef.current = textareaRef.current as HTMLElement | null
    openDirectionRef.current = 'above'
  }, [])

  const togglePicker = useCallback(() => setIsPickerOpen((v) => !v), [])
  const closePicker = useCallback(() => setIsPickerOpen(false), [])

  const onEmojiSelect = useCallback(
    (rawEmoji: string) => {
      const emoji = rawEmoji

      if (activeFieldRef.current === 'subject') {
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
    [subjectFieldName, bodyFieldName, getValues, setValue],
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
    openDirectionRef,
  }
}
