export interface EmojiCategory {
  label: string
  emojis: readonly string[]
}

// Variation Selector-16 (U+FE0F) is intentionally omitted from symbols that
// have both text and emoji presentations (⚠, ❤, ➡ …). Modern browsers render
// them as emoji without it; including VS-16 causes visible □ artifacts in some
// fonts and environments.
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  { label: 'תגובות',  emojis: ['👋', '😊', '🙏', '🤝', '👍', '💯', '😄', '🫂'] },
  { label: 'סטטוס',   emojis: ['✅', '❌', '⚠',  '❗', '📌', '🔔', '⭐', '🔥'] },
  { label: 'עסקי',    emojis: ['📧', '📅', '📞', '💼', '📋', '📝', '🔗', '📊'] },
  { label: 'חגיגה',   emojis: ['🎉', '🎊', '🥳', '🏆', '🎁', '❤',  '💙', '💚'] },
  { label: 'כיוונים', emojis: ['➡',  '⬅',  '⬆',  '⬇',  '↩',  '⏩', '🔄', '📍'] },
]
