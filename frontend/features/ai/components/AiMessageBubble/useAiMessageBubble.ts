import type { ChatMessage } from '@/features/ai/types'

export interface AiMessageBubbleProps {
  message: ChatMessage
  isLastStreaming: boolean
}

export interface UseAiMessageBubbleReturn {
  isUser: boolean
  content: string
  isLastStreaming: boolean
}

export const useAiMessageBubble = (props: AiMessageBubbleProps): UseAiMessageBubbleReturn => ({
  isUser: props.message.role === 'user',
  content: props.message.content,
  isLastStreaming: props.isLastStreaming,
})
