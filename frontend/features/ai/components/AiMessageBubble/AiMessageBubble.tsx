import type { ReactElement } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AiEmailDraftCta } from '../AiEmailDraftCta/AiEmailDraftCta'
import { AiStreamingCursor } from '../AiStreamingCursor/AiStreamingCursor'
import { useAiMessageBubble } from './useAiMessageBubble'
import type { AiMessageBubbleProps } from './useAiMessageBubble'
import styles from './AiMessageBubble.module.scss'

export type { AiMessageBubbleProps }

export const AiMessageBubble = (props: AiMessageBubbleProps): ReactElement => {
  const { isUser, content, isLastStreaming, showEmailCta } = useAiMessageBubble(props)

  return (
    <div className={`${styles.bubble} ${isUser ? styles.user : styles.model}`}>
      <div className={`${styles.content} ${isUser ? '' : styles.modelContent}`}>
        {isUser ? (
          content
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        )}
        {isLastStreaming && <AiStreamingCursor />}
        {showEmailCta && <AiEmailDraftCta />}
      </div>
    </div>
  )
}
