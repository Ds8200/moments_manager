export interface EmojiCategory {
  label: string
  emojis: readonly string[]
}

// Emojis with dual text/emoji Unicode presentations include VS-16 (U+FE0F) to
// force emoji rendering in email clients (which default to text presentation).
// Pure emoji codepoints in the supplementary plane (😊, 👍, 🎉…) need no VS-16.
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    label: 'תגובות',
    emojis: ['👋', '😊', '🙏', '🤝', '👍', '💯', '😄', '🫂', '👏', '🤩', '😎', '🥰', '💪', '🙌', '🫶', '😇'],
  },
  {
    label: 'סטטוס',
    emojis: ['✅', '❌', '⚠️', '❗', '📌', '🔔', '⭐', '🔥', '⏳', '🚀', '💡', '📢', '✨', '🆕', '🔒', '⏰'],
  },
  {
    label: 'עסקי',
    emojis: ['📧', '📅', '📞', '💼', '📋', '📝', '🔗', '📊', '💰', '🏷️', '🧾', '📦', '🖨️', '🎨', '✏️', '🔍'],
  },
  {
    label: 'חגיגה',
    emojis: ['🎉', '🎊', '🥳', '🏆', '🎁', '🎈', '🎂', '🎆', '🌟', '🥂', '🍾', '🏅', '🎗️', '🎀', '🎵', '🎶'],
  },
  {
    label: 'לבבות',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💗', '💖', '💓', '💞', '💝', '💘', '❣️'],
  },
  {
    label: 'כיוונים',
    emojis: ['➡️', '⬅️', '⬆️', '⬇️', '↩️', '↪️', '⏩', '🔄', '📍', '📌', '🔝', '🔙', '🔛', '🔜', '🔚', '▶️'],
  },
]
