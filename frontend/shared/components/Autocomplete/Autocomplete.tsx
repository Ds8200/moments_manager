'use client'
import type { ReactElement } from 'react'
import { useAutocomplete } from './useAutocomplete'
import type { AutocompleteProps } from './useAutocomplete'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import styles from './Autocomplete.module.scss'

export const Autocomplete = <T = unknown>(props: AutocompleteProps<T>): ReactElement => {
  const {
    inputId, listboxId, label, error, placeholder, disabled, isLoading, options,
    inputValue, isOpen, highlightedIndex, containerRef,
    onInputChange, onOptionSelect, onKeyDown, onInputFocus, onBlur,
  } = useAutocomplete(props)

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
            <li className={styles.statusItem}>{UI_LABELS.LOADING}</li>
          )}
          {!isLoading && options.length === 0 && (
            <li className={styles.statusItem}>{UI_LABELS.NO_RESULTS}</li>
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
