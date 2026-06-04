import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useRef } from 'react'
import { useEmojiPicker } from '../useEmojiPicker'

function makeButtonRef() {
  return { current: null } as React.RefObject<HTMLButtonElement | null>
}

describe('useEmojiPicker', () => {
  it('returns a containerRef and flipUp', () => {
    const { result } = renderHook(() =>
      useEmojiPicker({ isOpen: true, onClose: vi.fn(), buttonRef: makeButtonRef() })
    )
    expect(result.current.containerRef).toBeDefined()
    expect(typeof result.current.flipUp).toBe('boolean')
  })

  it('calls onClose when mousedown fires outside the container', () => {
    const onClose = vi.fn()
    renderHook(() =>
      useEmojiPicker({ isOpen: true, onClose, buttonRef: makeButtonRef() })
    )

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not call onClose when isOpen is false', () => {
    const onClose = vi.fn()
    renderHook(() =>
      useEmojiPicker({ isOpen: false, onClose, buttonRef: makeButtonRef() })
    )

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('removes event listener on unmount', () => {
    const onClose = vi.fn()
    const { unmount } = renderHook(() =>
      useEmojiPicker({ isOpen: true, onClose, buttonRef: makeButtonRef() })
    )

    unmount()

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not call onClose when mousedown is inside the toggle button', () => {
    const onClose = vi.fn()
    const button = document.createElement('button')
    document.body.appendChild(button)
    const buttonRef = { current: button } as React.RefObject<HTMLButtonElement | null>

    renderHook(() => useEmojiPicker({ isOpen: true, onClose, buttonRef }))

    act(() => {
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
    document.body.removeChild(button)
  })
})
