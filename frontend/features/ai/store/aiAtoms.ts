import { atom } from 'jotai'
import type { ChatMessage } from '@/features/ai/types'

export interface EmailDraft {
  customer_id: string | null
  customer_name: string
  subject: string
  body_text: string
}

export const conversationAtom = atom<ChatMessage[]>([])

export const isStreamingAtom = atom<boolean>(false)

export const streamErrorAtom = atom<string | null>(null)

export const appendMessageAtom = atom(
  null,
  (_get, set, msg: ChatMessage) => {
    set(conversationAtom, (prev) => [...prev, msg])
  }
)

export const appendTokenAtom = atom(
  null,
  (_get, set, token: string) => {
    set(conversationAtom, (prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      if (last.role !== 'assistant') return prev
      return [
        ...prev.slice(0, -1),
        { ...last, content: last.content + token },
      ]
    })
  }
)

export const finalizeStreamAtom = atom(
  null,
  (_get, set) => {
    set(conversationAtom, (prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      return [...prev.slice(0, -1), { ...last, isStreaming: false }]
    })
  }
)

export const clearConversationAtom = atom(
  null,
  (_get, set) => {
    set(conversationAtom, [])
    set(isStreamingAtom, false)
    set(streamErrorAtom, null)
    set(activeToolAtom, null)
    set(emailDraftAtom, null)
  }
)

export const activeToolAtom = atom<string | null>(null)

export const setActiveToolAtom = atom(
  null,
  (_get, set, toolName: string | null) => {
    set(activeToolAtom, toolName)
  }
)

export const emailDraftAtom = atom<EmailDraft | null>(null)

export const setEmailDraftAtom = atom(
  null,
  (_get, set, draft: EmailDraft | null) => {
    set(emailDraftAtom, draft)
  }
)
