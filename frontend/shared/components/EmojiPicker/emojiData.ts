export interface EmojiCategory {
  label: string
  emojis: readonly string[]
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  { label: 'תגובות',  emojis: ['👋', '😊', '🙏', '🤝', '👍', '💯', '😄', '🫂'] },
  { label: 'סטטוס',   emojis: ['✅', '❌', '⚠️', '❗', '📌', '🔔', '⭐', '🔥'] },
  { label: 'עסקי',    emojis: ['📧', '📅', '📞', '💼', '📋', '📝', '🔗', '📊'] },
  { label: 'חגיגה',   emojis: ['🎉', '🎊', '🥳', '🏆', '🎁', '❤️', '💙', '💚'] },
  { label: 'כיוונים', emojis: ['➡️', '⬅️', '⬆️', '⬇️', '↩️', '⏩', '🔄', '📍'] },
]
