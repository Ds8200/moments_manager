'use client'

import { useAtomValue } from 'jotai'
import { type ChangeEvent, type KeyboardEvent, useCallback, useState } from 'react'
import { isStreamingAtom, streamErrorAtom } from '@/features/ai/store/aiAtoms'
import { useAiStream } from '@/features/ai/queries/useAiStream'

export interface UseAiInputBarReturn {
  value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onRetry: () => void
  isDisabled: boolean
  error: string | null
}

export const useAiInputBar = (): UseAiInputBarReturn => {
  const [value, setValue] = useState('')
  const isStreaming = useAtomValue(isStreamingAtom)
  const error = useAtomValue(streamErrorAtom)
  const { sendMessage, retry } = useAiStream()

  const handleSend = useCallback((): void => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    setValue('')
    void sendMessage(trimmed)
  }, [value, isStreaming, sendMessage])

  const onChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>): void => {
    setValue(e.target.value)
  }, [])

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return {
    value,
    onChange,
    onKeyDown,
    onSend: handleSend,
    onRetry: retry,
    isDisabled: isStreaming || value.trim().length === 0,
    error,
  }
}
