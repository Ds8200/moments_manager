import type { ReactElement } from 'react'
import { AiStreamingCursor } from '../AiStreamingCursor/AiStreamingCursor'
import type { ChatMessage } from '@/features/ai/types'
import styles from './AiMessageBubble.module.scss'

export interface AiMessageBubbleProps {
  message: ChatMessage
  isLastStreaming: boolean
}

export const AiMessageBubble = ({
  message,
  isLastStreaming,
}: AiMessageBubbleProps): ReactElement => {
  const isUser = message.role === 'user'
  const lines = message.content.split('\n')

  return (
    <div className={`${styles.bubble} ${isUser ? styles.user : styles.model}`}>
      <div className={styles.content}>
        {lines.map((line, i) => (
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
        {isLastStreaming && <AiStreamingCursor />}
      </div>
    </div>
  )
}
