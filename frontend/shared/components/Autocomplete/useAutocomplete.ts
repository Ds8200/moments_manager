'use client'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { ChangeEvent, KeyboardEvent, RefObject } from 'react'

export interface AutocompleteOption<T = unknown> {
  value: string
  label: string
  data?: T
}

export interface AutocompleteProps<T = unknown> {
  value: string | null
  onChange: (value: string | null, option: AutocompleteOption<T> | null) => void
  options: AutocompleteOption<T>[]
  onSearch: (query: string) => void
  onFreeText?: (text: string) => void
  defaultLabel?: string
  isLoading?: boolean
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  id?: string
}

export interface UseAutocompleteReturn<T> {
  inputId: string
  listboxId: string
  label: string | undefined
  error: string | undefined
  placeholder: string | undefined
  disabled: boolean | undefined
  isLoading: boolean | undefined
  options: AutocompleteOption<T>[]
  inputValue: string
  isOpen: boolean
  highlightedIndex: number
  containerRef: RefObject<HTMLDivElement | null>
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onOptionSelect: (option: AutocompleteOption<T>) => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  onInputFocus: () => void
  onBlur: () => void
}

export const useAutocomplete = <T = unknown>(
  props: AutocompleteProps<T>
): UseAutocompleteReturn<T> => {
  const { value, onChange, options, onSearch, onFreeText, defaultLabel, id, label, error, placeholder, disabled, isLoading } = props

  const inputId   = id ?? 'autocomplete'
  const listboxId = `${inputId}-listbox`

  // typedValue: what the user is currently typing
  // isUserTyping: whether the input shows typed text vs. the selected label
  const [typedValue, setTypedValue] = useState('')
  const [isUserTyping, setIsUserTyping] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Synced via useEffect so setTimeout closures always read the latest values
  const typedValueRef = useRef(typedValue)
  const isUserTypingRef = useRef(isUserTyping)
  useEffect(() => { typedValueRef.current = typedValue }, [typedValue])
  useEffect(() => { isUserTypingRef.current = isUserTyping }, [isUserTyping])

  // Derived: the committed label for the current value (no setState in effect needed)
  const selectedLabel = useMemo(() => {
    if (!value) return ''
    const match = options.find((o) => o.value === value)
    return match?.label ?? defaultLabel ?? ''
  }, [value, options, defaultLabel])

  // What the input actually shows
  const inputValue = isUserTyping ? typedValue : selectedLabel

  // Close dropdown on outside click and restore selected label
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setIsUserTyping(false)
        setTypedValue('')
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value
      setTypedValue(query)
      setIsUserTyping(true)
      setIsOpen(true)
      setHighlightedIndex(-1)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onSearch(query), 300)
    },
    [onSearch]
  )

  const onOptionSelect = useCallback(
    (option: AutocompleteOption<T>) => {
      setIsUserTyping(false)
      setTypedValue('')
      setIsOpen(false)
      setHighlightedIndex(-1)
      onChange(option.value, option)
    },
    [onChange]
  )

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown') {
          setIsOpen(true)
          onSearch('')
          setHighlightedIndex(0)
        }
        return
      }
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((i) => (i < options.length - 1 ? i + 1 : i))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((i) => (i > 0 ? i - 1 : 0))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && options[highlightedIndex]) {
            onOptionSelect(options[highlightedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setIsUserTyping(false)
          setTypedValue('')
          break
      }
    },
    [isOpen, options, highlightedIndex, onOptionSelect, onSearch]
  )

  const onInputFocus = useCallback(() => {
    setIsOpen(true)
    onSearch(isUserTyping ? typedValue : selectedLabel)
  }, [isUserTyping, typedValue, selectedLabel, onSearch])

  // Delay close so mousedown on option fires before blur.
  // Reads refs so the timeout always sees the latest state, not a stale closure.
  const onBlur = useCallback(() => {
    setTimeout(() => {
      const typed = typedValueRef.current
      const wasTyping = isUserTypingRef.current
      setIsOpen(false)
      setIsUserTyping(false)
      setTypedValue('')
      if (wasTyping && typed.trim()) {
        onFreeText?.(typed.trim())
      }
    }, 150)
  }, [onFreeText])

  return {
    inputId,
    listboxId,
    label,
    error,
    placeholder,
    disabled,
    isLoading,
    options,
    inputValue,
    isOpen,
    highlightedIndex,
    containerRef,
    onInputChange,
    onOptionSelect,
    onKeyDown,
    onInputFocus,
    onBlur,
  }
}
