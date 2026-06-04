'use client'

import { useAtomValue } from 'jotai'
import { ANALYZING_DEFAULT, TOOL_LABELS } from '@/features/ai/constants/aiLabels'
import { activeToolAtom } from '@/features/ai/store/aiAtoms'

export interface UseAiStreamingCursorReturn {
  toolLabel: string | null
}

export const useAiStreamingCursor = (): UseAiStreamingCursorReturn => {
  const activeTool = useAtomValue(activeToolAtom)
  const toolLabel = activeTool
    ? (TOOL_LABELS[activeTool] ?? ANALYZING_DEFAULT)
    : null
  return { toolLabel }
}
