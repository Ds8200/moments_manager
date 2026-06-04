'use client'

import { useCallback } from 'react'
import { AI_SUGGESTED_PROMPTS } from '@/features/ai/constants/aiLabels'
import type { SuggestedPrompt } from '@/features/ai/types'

export interface UseAiSuggestedPromptsReturn {
  prompts: readonly SuggestedPrompt[]
  handleSelect: (prompt: string) => void
}

export const useAiSuggestedPrompts = (
  onSelect: (prompt: string) => void
): UseAiSuggestedPromptsReturn => {
  const handleSelect = useCallback(
    (prompt: string): void => {
      onSelect(prompt)
    },
    [onSelect]
  )

  return { prompts: AI_SUGGESTED_PROMPTS, handleSelect }
}
