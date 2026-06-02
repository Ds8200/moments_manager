import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useEmojiPicker } from '../useEmojiPicker'

describe('useEmojiPicker', () => {
  it('returns a containerRef', () => {
    const { result } = renderHook(() =>
      useEmojiPicker({ isOpen: true, onClose: vi.fn() })
    )
    expect(result.current.containerRef).toBeDefined()
  })

  it('calls onClose when mousedown fires outside the container', () => {
    const onClose = vi.fn()
    renderHook(() => useEmojiPicker({ isOpen: true, onClose }))

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not call onClose when isOpen is false', () => {
    const onClose = vi.fn()
    renderHook(() => useEmojiPicker({ isOpen: false, onClose }))

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('removes event listener on unmount', () => {
    const onClose = vi.fn()
    const { unmount } = renderHook(() =>
      useEmojiPicker({ isOpen: true, onClose })
    )

    unmount()

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
  })
})
