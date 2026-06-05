'use client'

import { useAtomValue } from 'jotai'
import { conversationAtom, emailDraftAtom } from '@/features/ai/store/aiAtoms'
import type { ChatMessage } from '@/features/ai/types'

export interface AiMessageBubbleProps {
  message: ChatMessage
  isLastStreaming: boolean
}

export interface UseAiMessageBubbleReturn {
  isUser: boolean
  content: string
  isLastStreaming: boolean
  showEmailCta: boolean
}

export const useAiMessageBubble = (props: AiMessageBubbleProps): UseAiMessageBubbleReturn => {
  const emailDraft = useAtomValue(emailDraftAtom)
  const conversation = useAtomValue(conversationAtom)

  const isUser = props.message.role === 'user'
  const isLastMessage =
    conversation.length > 0 &&
    conversation[conversation.length - 1].id === props.message.id
  const showEmailCta =
    !isUser && !props.message.isStreaming && emailDraft !== null && isLastMessage

  return {
    isUser,
    content: props.message.content,
    isLastStreaming: props.isLastStreaming,
    showEmailCta,
  }
}
