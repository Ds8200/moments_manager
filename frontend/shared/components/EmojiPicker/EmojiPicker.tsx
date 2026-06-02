'use client'
import type { JSX } from 'react'
import { useEmojiPicker } from './useEmojiPicker'
import type { EmojiPickerProps } from './useEmojiPicker'
import { EMOJI_CATEGORIES } from './emojiData'
import styles from './EmojiPicker.module.scss'

export { type EmojiPickerProps }

export const EmojiPicker = ({ isOpen, onClose, onSelect }: EmojiPickerProps): JSX.Element => {
  const { containerRef } = useEmojiPicker({ isOpen, onClose })

  return (
    <>
      {isOpen && (
        <div className={styles.panel} ref={containerRef} role="dialog" aria-label="בחר אמוג'י">
          {EMOJI_CATEGORIES.map((category) => (
            <div key={category.label} className={styles.category}>
              <span className={styles.categoryLabel}>{category.label}</span>
              <div className={styles.grid}>
                {category.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={styles.emojiBtn}
                    onClick={() => onSelect(emoji)}
                    aria-label={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
