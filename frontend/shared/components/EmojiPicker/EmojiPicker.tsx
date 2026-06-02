'use client'
import type { JSX } from 'react'
import { useEmojiPicker } from './useEmojiPicker'
import type { EmojiPickerProps } from './useEmojiPicker'
import { EMOJI_CATEGORIES } from './emojiData'
import styles from './EmojiPicker.module.scss'

export { type EmojiPickerProps }

// Strip Variation Selector-16 (U+FE0F) for display — modern browsers render
// these emojis correctly without it, and leaving it in causes visible □ glyphs
// in some fonts regardless of what's stored in emojiData.ts.
const stripVS16 = (s: string): string => s.replace(/️/g, '')

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
                    key={stripVS16(emoji)}
                    type="button"
                    className={styles.emojiBtn}
                    onClick={() => onSelect(stripVS16(emoji))}
                    aria-label={stripVS16(emoji)}
                  >
                    {stripVS16(emoji)}
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
