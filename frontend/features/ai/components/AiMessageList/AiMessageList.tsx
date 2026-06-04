import type { ReactElement } from 'react'
import { AiMessageBubble } from '../AiMessageBubble/AiMessageBubble'
import { AiSuggestedPrompts } from '../AiSuggestedPrompts/AiSuggestedPrompts'
import { useAiMessageList } from './useAiMessageList'
import styles from './AiMessageList.module.scss'

export interface AiMessageListProps {
  onSuggestedPrompt: (prompt: string) => void
}

export const AiMessageList = ({ onSuggestedPrompt }: AiMessageListProps): ReactElement => {
  const { messages, isEmpty, isStreaming, listRef } = useAiMessageList()

  return (
    <div className={styles.list} ref={listRef}>
      {isEmpty ? (
        <AiSuggestedPrompts onSelect={onSuggestedPrompt} />
      ) : (
        messages.map((msg, idx) => (
          <AiMessageBubble
            key={msg.id}
            message={msg}
            isLastStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
          />
        ))
      )}
    </div>
  )
}
