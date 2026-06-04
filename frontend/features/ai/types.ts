export type MessageRole = 'user' | 'model'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  isStreaming?: boolean
}

export type SSEEventType = 'token' | 'tool_call' | 'tool_result' | 'done' | 'error'

export interface SSEEvent {
  type: SSEEventType
  content?: string
  tool_name?: string
  data?: Record<string, unknown>
  error?: string
}

export interface SuggestedPrompt {
  id: string
  label: string
  prompt: string
}

export interface AiChatRequest {
  messages: Array<{ role: MessageRole; content: string }>
}
