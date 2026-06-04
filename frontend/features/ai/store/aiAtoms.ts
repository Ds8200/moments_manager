import { atom } from 'jotai'
import type { ChatMessage } from '@/features/ai/types'

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
      if (last.role !== 'model') return prev
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
  }
)
