'use client'
import { useAutocomplete } from './useAutocomplete'
import type { AutocompleteProps } from './useAutocomplete'
import styles from './Autocomplete.module.scss'

const LABELS = {
  LOADING:    'טוען...',
  NO_RESULTS: 'לא נמצאו תוצאות',
} as const

export function Autocomplete<T = unknown>(props: AutocompleteProps<T>) {
  const { label, error, placeholder, disabled, id, isLoading, options } = props
  const {
    inputValue,
    isOpen,
    highlightedIndex,
    containerRef,
    onInputChange,
    onOptionSelect,
    onKeyDown,
    onInputFocus,
    onBlur,
  } = useAutocomplete(props)

  const inputId   = id ?? 'autocomplete'
  const listboxId = `${inputId}-listbox`

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={`${styles.inputWrapper}${error ? ` ${styles.hasError}` : ''}`}>
        <input
          id={inputId}
          type="text"
          className={styles.input}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            highlightedIndex >= 0 ? `${inputId}-option-${highlightedIndex}` : undefined
          }
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          onFocus={onInputFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
      {isOpen && (
        <ul id={listboxId} className={styles.dropdown} role="listbox">
          {isLoading && (
            <li className={styles.statusItem}>{LABELS.LOADING}</li>
          )}
          {!isLoading && options.length === 0 && (
            <li className={styles.statusItem}>{LABELS.NO_RESULTS}</li>
          )}
          {!isLoading && options.map((option, idx) => (
            <li
              key={option.value}
              id={`${inputId}-option-${idx}`}
              className={`${styles.option}${idx === highlightedIndex ? ` ${styles.highlighted}` : ''}`}
              role="option"
              aria-selected={idx === highlightedIndex}
              onMouseDown={() => onOptionSelect(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
