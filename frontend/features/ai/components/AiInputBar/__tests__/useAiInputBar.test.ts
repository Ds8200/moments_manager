import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { isStreamingAtom, streamErrorAtom } from '@/features/ai/store/aiAtoms'
import { useAiInputBar } from '../useAiInputBar'

const mockSendMessage = vi.fn()
const mockRetry = vi.fn()

vi.mock('@/features/ai/queries/useAiStream', () => ({
  useAiStream: () => ({ sendMessage: mockSendMessage, retry: mockRetry }),
}))

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useAiInputBar', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
    mockSendMessage.mockClear()
    mockRetry.mockClear()
  })

  it('initial value is empty string', () => {
    const { result } = renderHook(() => useAiInputBar(), {
      wrapper: makeWrapper(store),
    })
    expect(result.current.value).toBe('')
  })

  it('isDisabled is true when value is empty', () => {
    const { result } = renderHook(() => useAiInputBar(), {
      wrapper: makeWrapper(store),
    })
    expect(result.current.isDisabled).toBe(true)
  })

  it('isDisabled is false when value has content', () => {
    const { result } = renderHook(() => useAiInputBar(), {
      wrapper: makeWrapper(store),
    })
    act(() => {
      result.current.onChange({
        target: { value: 'שאלה' },
      } as React.ChangeEvent<HTMLTextAreaElement>)
    })
    expect(result.current.isDisabled).toBe(false)
  })

  it('isDisabled is true while streaming even with content', () => {
    store.set(isStreamingAtom, true)
    const { result } = renderHook(() => useAiInputBar(), {
      wrapper: makeWrapper(store),
    })
    act(() => {
      result.current.onChange({
        target: { value: 'text' },
      } as React.ChangeEvent<HTMLTextAreaElement>)
    })
    expect(result.current.isDisabled).toBe(true)
  })

  it('Enter key calls sendMessage and clears value', async () => {
    const { result } = renderHook(() => useAiInputBar(), {
      wrapper: makeWrapper(store),
    })

    act(() => {
      result.current.onChange({
        target: { value: 'שאלה' },
      } as React.ChangeEvent<HTMLTextAreaElement>)
    })
    act(() => {
      result.current.onKeyDown({
        key: 'Enter',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>)
    })

    expect(result.current.value).toBe('')
    expect(mockSendMessage).toHaveBeenCalledWith('שאלה')
  })

  it('Shift+Enter does NOT submit', () => {
    const { result } = renderHook(() => useAiInputBar(), {
      wrapper: makeWrapper(store),
    })

    act(() => {
      result.current.onChange({
        target: { value: 'text' },
      } as React.ChangeEvent<HTMLTextAreaElement>)
    })
    act(() => {
      result.current.onKeyDown({
        key: 'Enter',
        shiftKey: true,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>)
    })

    expect(result.current.value).toBe('text')
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('error comes from streamErrorAtom', () => {
    store.set(streamErrorAtom, 'some error')
    const { result } = renderHook(() => useAiInputBar(), {
      wrapper: makeWrapper(store),
    })
    expect(result.current.error).toBe('some error')
  })

  it('onRetry calls retry from useAiStream', () => {
    const { result } = renderHook(() => useAiInputBar(), {
      wrapper: makeWrapper(store),
    })
    act(() => {
      result.current.onRetry()
    })
    expect(mockRetry).toHaveBeenCalled()
  })
})
