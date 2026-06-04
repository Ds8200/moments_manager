'use client'

import { useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { clearConversationAtom, isStreamingAtom } from '@/features/ai/store/aiAtoms'
import { useAiStream } from '@/features/ai/queries/useAiStream'
import { useAtomValue } from 'jotai'

export interface UseAiPageReturn {
  handleClear: () => void
  handleSuggestedPrompt: (prompt: string) => void
  isStreaming: boolean
}

export const useAiPage = (): UseAiPageReturn => {
  const clearConversation = useSetAtom(clearConversationAtom)
  const isStreaming = useAtomValue(isStreamingAtom)
  const { sendMessage } = useAiStream()

  const handleClear = useCallback((): void => {
    clearConversation()
  }, [clearConversation])

  const handleSuggestedPrompt = useCallback(
    (prompt: string): void => {
      void sendMessage(prompt)
    },
    [sendMessage]
  )

  return { handleClear, handleSuggestedPrompt, isStreaming }
}
