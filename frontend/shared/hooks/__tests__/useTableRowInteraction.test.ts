import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useTableRowInteraction } from '../useTableRowInteraction'
import { LONG_PRESS_DURATION_MS } from '@/shared/constants/interaction'
import type { RowInteractionHandlers } from '../useTableRowInteraction'

// The hook types its event params as React's MouseEvent/TouchEvent, but only reads
// `currentTarget`/`preventDefault` — a minimal fake covering those is enough for these tests.
function makeMouseEvent(): { preventDefault: () => void; currentTarget: Element } {
  return { preventDefault: vi.fn(), currentTarget: document.createElement('tr') }
}

function makeTouchEvent(): { currentTarget: Element } {
  return { currentTarget: document.createElement('tr') }
}

describe('useTableRowInteraction', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('onClick calls onActivate', () => {
    const onActivate = vi.fn()
    const { result } = renderHook(() => useTableRowInteraction())
    const row = result.current.getRowProps({ onActivate, menuTitle: 'title', items: [] })

    act(() => row.onClick())

    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('onClick does nothing when onActivate is not provided', () => {
    const { result } = renderHook(() => useTableRowInteraction())
    const row = result.current.getRowProps({ menuTitle: 'title', items: [] })

    expect(() => act(() => row.onClick())).not.toThrow()
  })

  it('onContextMenu prevents the default menu and opens the dropdown', () => {
    const items = [{ label: 'Edit', onClick: vi.fn() }]
    const { result } = renderHook(() => useTableRowInteraction())
    const row = result.current.getRowProps({ menuTitle: 'title', items })
    const event = makeMouseEvent()

    act(() => row.onContextMenu(event as unknown as Parameters<RowInteractionHandlers['onContextMenu']>[0]))

    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(result.current.menuState.isOpen).toBe(true)
    expect(result.current.menuState.title).toBe('title')
  })

  it('onContextMenu does nothing when there are no menu items', () => {
    const { result } = renderHook(() => useTableRowInteraction())
    const row = result.current.getRowProps({ menuTitle: 'title', items: [] })
    const event = makeMouseEvent()

    act(() => row.onContextMenu(event as unknown as Parameters<RowInteractionHandlers['onContextMenu']>[0]))

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(result.current.menuState.isOpen).toBe(false)
  })

  it('a long-press (touch hold) opens the menu and swallows the following click', () => {
    vi.useFakeTimers()
    const onActivate = vi.fn()
    const items = [{ label: 'Edit', onClick: vi.fn() }]
    const { result } = renderHook(() => useTableRowInteraction())
    const row = result.current.getRowProps({ onActivate, menuTitle: 'title', items })
    const touch = makeTouchEvent()

    act(() => row.onTouchStart(touch as unknown as Parameters<RowInteractionHandlers['onTouchStart']>[0]))
    act(() => { vi.advanceTimersByTime(LONG_PRESS_DURATION_MS) })

    expect(result.current.menuState.isOpen).toBe(true)

    // the trailing synthetic click after a long-press must not also navigate
    const rowAfterLongPress = result.current.getRowProps({ onActivate, menuTitle: 'title', items })
    act(() => rowAfterLongPress.onClick())
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('onTouchMove cancels a pending long-press', () => {
    vi.useFakeTimers()
    const items = [{ label: 'Edit', onClick: vi.fn() }]
    const { result } = renderHook(() => useTableRowInteraction())
    const row = result.current.getRowProps({ menuTitle: 'title', items })
    const touch = makeTouchEvent()

    act(() => row.onTouchStart(touch as unknown as Parameters<RowInteractionHandlers['onTouchStart']>[0]))
    act(() => row.onTouchMove())
    act(() => { vi.advanceTimersByTime(LONG_PRESS_DURATION_MS) })

    expect(result.current.menuState.isOpen).toBe(false)
  })

  it('onKeyDown triggers onActivate on Enter and Space', () => {
    const onActivate = vi.fn()
    const { result } = renderHook(() => useTableRowInteraction())
    const row = result.current.getRowProps({ onActivate, menuTitle: 'title', items: [] })

    const enterEvent = { key: 'Enter', preventDefault: vi.fn() }
    const spaceEvent = { key: ' ', preventDefault: vi.fn() }
    const otherEvent = { key: 'a', preventDefault: vi.fn() }

    act(() => row.onKeyDown(enterEvent as unknown as Parameters<RowInteractionHandlers['onKeyDown']>[0]))
    act(() => row.onKeyDown(spaceEvent as unknown as Parameters<RowInteractionHandlers['onKeyDown']>[0]))
    act(() => row.onKeyDown(otherEvent as unknown as Parameters<RowInteractionHandlers['onKeyDown']>[0]))

    expect(onActivate).toHaveBeenCalledTimes(2)
    expect(otherEvent.preventDefault).not.toHaveBeenCalled()
  })
})
