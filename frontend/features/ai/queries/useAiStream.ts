'use client'

import { useAtom, useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { AI_LABELS } from '@/features/ai/constants/aiLabels'
import {
  appendMessageAtom,
  appendTokenAtom,
  clearConversationAtom,
  conversationAtom,
  finalizeStreamAtom,
  isStreamingAtom,
  streamErrorAtom,
} from '@/features/ai/store/aiAtoms'
import type { ChatMessage, SSEEvent } from '@/features/ai/types'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { apiStream } from '@/shared/utils/apiStream'

let _idCounter = 0
function nextId(): string {
  return `msg-${++_idCounter}`
}

export interface UseAiStreamReturn {
  sendMessage: (text: string) => Promise<void>
  retry: () => void
}

export const useAiStream = (): UseAiStreamReturn => {
  const [conversation] = useAtom(conversationAtom)
  const appendMessage = useSetAtom(appendMessageAtom)
  const appendToken = useSetAtom(appendTokenAtom)
  const finalizeStream = useSetAtom(finalizeStreamAtom)
  const setIsStreaming = useSetAtom(isStreamingAtom)
  const setStreamError = useSetAtom(streamErrorAtom)
  const clearConversation = useSetAtom(clearConversationAtom)

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const userMsg: ChatMessage = { id: nextId(), role: 'user', content: text }
      const modelMsg: ChatMessage = { id: nextId(), role: 'assistant', content: '', isStreaming: true }

      appendMessage(userMsg)
      appendMessage(modelMsg)
      setIsStreaming(true)
      setStreamError(null)

      const historySnapshot = [...conversation, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      try {
        const stream = apiStream<SSEEvent>(API_ENDPOINTS.AI_CHAT, {
          messages: historySnapshot,
        })

        for await (const event of stream) {
          if (event.type === 'token' && event.content) {
            appendToken(event.content)
          } else if (event.type === 'done') {
            finalizeStream()
          } else if (event.type === 'error') {
            setStreamError(event.error ?? AI_LABELS.ERROR_GENERIC)
            finalizeStream()
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : AI_LABELS.ERROR_GENERIC
        setStreamError(msg)
        finalizeStream()
      } finally {
        setIsStreaming(false)
      }
    },
    [conversation, appendMessage, appendToken, finalizeStream, setIsStreaming, setStreamError]
  )

  const retry = useCallback((): void => {
    const msgs = conversation
    const lastUserIdx = [...msgs].reverse().findIndex((m) => m.role === 'user')
    if (lastUserIdx === -1) return

    const realIdx = msgs.length - 1 - lastUserIdx
    const lastUserText = msgs[realIdx].content

    clearConversation()
    // Re-add all messages up to (not including) the last user turn
    for (let i = 0; i < realIdx; i++) {
      appendMessage(msgs[i])
    }

    void sendMessage(lastUserText)
  }, [conversation, clearConversation, appendMessage, sendMessage])

  return { sendMessage, retry }
}
