'use client'

import { useAtomValue } from 'jotai'
import { type RefObject, useEffect, useRef } from 'react'
import { conversationAtom, isStreamingAtom } from '@/features/ai/store/aiAtoms'
import type { ChatMessage } from '@/features/ai/types'

export interface UseAiMessageListReturn {
  messages: ChatMessage[]
  isEmpty: boolean
  isStreaming: boolean
  listRef: RefObject<HTMLDivElement | null>
}

export const useAiMessageList = (): UseAiMessageListReturn => {
  const messages = useAtomValue(conversationAtom)
  const isStreaming = useAtomValue(isStreamingAtom)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = listRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  return {
    messages,
    isEmpty: messages.length === 0,
    isStreaming,
    listRef,
  }
}
