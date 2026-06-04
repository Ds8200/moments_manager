import { beforeEach, describe, expect, it } from 'vitest'
import { createStore } from 'jotai'
import {
  appendMessageAtom,
  appendTokenAtom,
  clearConversationAtom,
  conversationAtom,
  finalizeStreamAtom,
  isStreamingAtom,
  streamErrorAtom,
} from '../aiAtoms'
import type { ChatMessage } from '@/features/ai/types'

function makeStore() {
  return createStore()
}

const userMsg: ChatMessage = { id: '1', role: 'user', content: 'hello' }
const modelMsg: ChatMessage = { id: '2', role: 'assistant', content: '', isStreaming: true }

describe('aiAtoms', () => {
  let store: ReturnType<typeof makeStore>

  beforeEach(() => {
    store = makeStore()
  })

  it('conversationAtom initial value is empty array', () => {
    expect(store.get(conversationAtom)).toEqual([])
  })

  it('isStreamingAtom initial value is false', () => {
    expect(store.get(isStreamingAtom)).toBe(false)
  })

  it('streamErrorAtom initial value is null', () => {
    expect(store.get(streamErrorAtom)).toBeNull()
  })

  describe('appendMessageAtom', () => {
    it('appends a message to the conversation', () => {
      store.set(appendMessageAtom, userMsg)
      expect(store.get(conversationAtom)).toHaveLength(1)
      expect(store.get(conversationAtom)[0]).toEqual(userMsg)
    })

    it('appends multiple messages in order', () => {
      store.set(appendMessageAtom, userMsg)
      store.set(appendMessageAtom, modelMsg)
      const conv = store.get(conversationAtom)
      expect(conv).toHaveLength(2)
      expect(conv[0].role).toBe('user')
      expect(conv[1].role).toBe('assistant')
    })
  })

  describe('appendTokenAtom', () => {
    it('appends token to the last model message', () => {
      store.set(appendMessageAtom, userMsg)
      store.set(appendMessageAtom, modelMsg)
      store.set(appendTokenAtom, 'שלום')

      const last = store.get(conversationAtom).at(-1)!
      expect(last.content).toBe('שלום')
    })

    it('is a no-op if last message is user', () => {
      store.set(appendMessageAtom, userMsg)
      store.set(appendTokenAtom, 'token')

      const last = store.get(conversationAtom).at(-1)!
      expect(last.content).toBe('hello') // unchanged
    })

    it('is a no-op on empty conversation', () => {
      store.set(appendTokenAtom, 'token')
      expect(store.get(conversationAtom)).toHaveLength(0)
    })

    it('accumulates tokens correctly', () => {
      store.set(appendMessageAtom, modelMsg)
      store.set(appendTokenAtom, 'שלום ')
      store.set(appendTokenAtom, 'עולם')

      const last = store.get(conversationAtom).at(-1)!
      expect(last.content).toBe('שלום עולם')
    })
  })

  describe('finalizeStreamAtom', () => {
    it('sets isStreaming to false on last model message', () => {
      store.set(appendMessageAtom, { ...modelMsg, isStreaming: true })
      store.set(finalizeStreamAtom)

      const last = store.get(conversationAtom).at(-1)!
      expect(last.isStreaming).toBe(false)
    })

    it('is a no-op on empty conversation', () => {
      store.set(finalizeStreamAtom)
      expect(store.get(conversationAtom)).toHaveLength(0)
    })
  })

  describe('clearConversationAtom', () => {
    it('clears all messages and resets atoms', () => {
      store.set(appendMessageAtom, userMsg)
      store.set(isStreamingAtom, true)
      store.set(streamErrorAtom, 'some error')

      store.set(clearConversationAtom)

      expect(store.get(conversationAtom)).toHaveLength(0)
      expect(store.get(isStreamingAtom)).toBe(false)
      expect(store.get(streamErrorAtom)).toBeNull()
    })
  })
})
