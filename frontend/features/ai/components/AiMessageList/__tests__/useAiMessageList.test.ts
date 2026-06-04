import React from 'react'
import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import {
  appendMessageAtom,
  conversationAtom,
  isStreamingAtom,
} from '@/features/ai/store/aiAtoms'
import type { ChatMessage } from '@/features/ai/types'
import { useAiMessageList } from '../useAiMessageList'

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

const userMsg: ChatMessage = { id: '1', role: 'user', content: 'hello' }
const modelMsg: ChatMessage = { id: '2', role: 'assistant', content: 'world', isStreaming: false }

describe('useAiMessageList', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  it('isEmpty is true when conversation is empty', () => {
    const { result } = renderHook(() => useAiMessageList(), {
      wrapper: makeWrapper(store),
    })
    expect(result.current.isEmpty).toBe(true)
  })

  it('isEmpty is false when conversation has messages', () => {
    store.set(appendMessageAtom, userMsg)
    const { result } = renderHook(() => useAiMessageList(), {
      wrapper: makeWrapper(store),
    })
    expect(result.current.isEmpty).toBe(false)
  })

  it('messages reflects conversationAtom', () => {
    store.set(appendMessageAtom, userMsg)
    store.set(appendMessageAtom, modelMsg)
    const { result } = renderHook(() => useAiMessageList(), {
      wrapper: makeWrapper(store),
    })
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0].role).toBe('user')
    expect(result.current.messages[1].role).toBe('model')
  })

  it('isStreaming reflects isStreamingAtom', () => {
    store.set(isStreamingAtom, true)
    const { result } = renderHook(() => useAiMessageList(), {
      wrapper: makeWrapper(store),
    })
    expect(result.current.isStreaming).toBe(true)
  })

  it('listRef is defined', () => {
    const { result } = renderHook(() => useAiMessageList(), {
      wrapper: makeWrapper(store),
    })
    expect(result.current.listRef).toBeDefined()
  })
})
