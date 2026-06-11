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
  setActiveToolAtom,
  setEmailDraftAtom,
  streamErrorAtom,
} from '@/features/ai/store/aiAtoms'
import type { ChatMessage, SSEEvent } from '@/features/ai/types'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { apiStream } from '@/shared/utils/apiStream'
import { resolveErrorMessage } from '@/shared/utils/resolveErrorMessage'

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
  const setActiveTool = useSetAtom(setActiveToolAtom)
  const setEmailDraft = useSetAtom(setEmailDraftAtom)
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
          } else if (event.type === 'tool_call') {
            setActiveTool(event.tool_name ?? null)
          } else if (
            event.type === 'tool_result' &&
            event.tool_name === 'draft_email' &&
            event.data
          ) {
            setEmailDraft({
              customer_id: (event.data.customer_id as string | null) ?? null,
              customer_name: (event.data.customer_name as string) ?? '',
              subject: (event.data.subject as string) ?? '',
              body_text: (event.data.body_text as string) ?? '',
              is_bulk: (event.data.is_bulk as boolean) === true,
            })
          } else if (event.type === 'done') {
            setActiveTool(null)
            finalizeStream()
          } else if (event.type === 'error') {
            setActiveTool(null)
            setStreamError(event.error ?? AI_LABELS.ERROR_GENERIC)
            finalizeStream()
          }
        }
      } catch (err: unknown) {
        setStreamError(resolveErrorMessage(err))
        finalizeStream()
      } finally {
        setIsStreaming(false)
      }
    },
    [conversation, appendMessage, appendToken, finalizeStream, setIsStreaming, setStreamError, setActiveTool, setEmailDraft]
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
