import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useEmojiPicker } from '../useEmojiPicker'
import type { RefObject } from 'react'

function makeButtonRef(): RefObject<HTMLButtonElement | null> {
  return { current: null }
}

function makeElementRef<T extends HTMLElement>(el: T | null = null): RefObject<T | null> {
  return { current: el }
}

describe('useEmojiPicker', () => {
  it('returns a containerRef', () => {
    const { result } = renderHook(() =>
      useEmojiPicker({
        isOpen: true,
        onClose: vi.fn(),
        triggerRef: makeButtonRef(),
        anchorRef: makeElementRef(),
        safeRefs: [],
      })
    )
    expect(result.current.containerRef).toBeDefined()
  })

  it('calls onClose when mousedown fires outside the container and safe refs', () => {
    const onClose = vi.fn()
    renderHook(() =>
      useEmojiPicker({
        isOpen: true,
        onClose,
        triggerRef: makeButtonRef(),
        anchorRef: makeElementRef(),
        safeRefs: [],
      })
    )

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not call onClose when isOpen is false', () => {
    const onClose = vi.fn()
    renderHook(() =>
      useEmojiPicker({
        isOpen: false,
        onClose,
        triggerRef: makeButtonRef(),
        anchorRef: makeElementRef(),
        safeRefs: [],
      })
    )

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('removes event listener on unmount', () => {
    const onClose = vi.fn()
    const { unmount } = renderHook(() =>
      useEmojiPicker({
        isOpen: true,
        onClose,
        triggerRef: makeButtonRef(),
        anchorRef: makeElementRef(),
        safeRefs: [],
      })
    )

    unmount()

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not call onClose when mousedown is inside the trigger button', () => {
    const onClose = vi.fn()
    const button = document.createElement('button')
    document.body.appendChild(button)
    const triggerRef = { current: button } as RefObject<HTMLButtonElement | null>

    renderHook(() =>
      useEmojiPicker({
        isOpen: true,
        onClose,
        triggerRef,
        anchorRef: makeElementRef(),
        safeRefs: [],
      })
    )

    act(() => {
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
    document.body.removeChild(button)
  })

  it('does not call onClose when mousedown is on a safeRef element', () => {
    const onClose = vi.fn()
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    const safeRef = { current: textarea } as RefObject<HTMLTextAreaElement | null>

    renderHook(() =>
      useEmojiPicker({
        isOpen: true,
        onClose,
        triggerRef: makeButtonRef(),
        anchorRef: makeElementRef(),
        safeRefs: [safeRef],
      })
    )

    act(() => {
      textarea.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
    document.body.removeChild(textarea)
  })
})
