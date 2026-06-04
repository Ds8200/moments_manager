'use client'
import type { JSX } from 'react'
import { useEmojiPicker } from './useEmojiPicker'
import type { EmojiPickerProps } from './useEmojiPicker'
import { EMOJI_CATEGORIES } from './emojiData'
import styles from './EmojiPicker.module.scss'

export { type EmojiPickerProps }

// Explicit unicode escape — more reliable than a literal U+FE0F which can be
// silently corrupted when source files are saved or copy-pasted between tools.
const stripVS16 = (s: string): string => s.replace(/️/g, '')

export const EmojiPicker = ({
  isOpen,
  onClose,
  onSelect,
  buttonRef,
}: EmojiPickerProps): JSX.Element => {
  const { containerRef, flipUp } = useEmojiPicker({ isOpen, onClose, buttonRef })

  return (
    <>
      {isOpen && (
        <div
          className={styles.panel}
          ref={containerRef}
          role="dialog"
          aria-label="בחר אמוג'י"
          data-flip={String(flipUp)}
        >
          {EMOJI_CATEGORIES.map((category) => (
            <div key={category.label} className={styles.category}>
              <span className={styles.categoryLabel}>{category.label}</span>
              <div className={styles.grid}>
                {category.emojis.map((emoji) => {
                  const clean = stripVS16(emoji)
                  return (
                    <button
                      key={clean}
                      type="button"
                      className={styles.emojiBtn}
                      onClick={() => onSelect(clean)}
                      aria-label={clean}
                    >
                      {clean}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
