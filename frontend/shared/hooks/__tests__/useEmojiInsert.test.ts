import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useEmojiInsert } from '../useEmojiInsert'

function makeRhf(initial = '') {
  let stored = initial
  const getValues = vi.fn((_field: string) => stored)
  const setValue = vi.fn((_field: string, value: string) => { stored = value })
  return { getValues, setValue, getStored: () => stored }
}

describe('useEmojiInsert', () => {
  it('starts with picker closed', () => {
    const { getValues, setValue } = makeRhf()
    const { result } = renderHook(() => useEmojiInsert('body', getValues, setValue))
    expect(result.current.isPickerOpen).toBe(false)
  })

  it('togglePicker opens and closes the picker', () => {
    const { getValues, setValue } = makeRhf()
    const { result } = renderHook(() => useEmojiInsert('body', getValues, setValue))

    act(() => result.current.togglePicker())
    expect(result.current.isPickerOpen).toBe(true)

    act(() => result.current.togglePicker())
    expect(result.current.isPickerOpen).toBe(false)
  })

  it('closePicker closes the picker', () => {
    const { getValues, setValue } = makeRhf()
    const { result } = renderHook(() => useEmojiInsert('body', getValues, setValue))

    act(() => result.current.togglePicker())
    act(() => result.current.closePicker())
    expect(result.current.isPickerOpen).toBe(false)
  })

  it('onEmojiSelect inserts emoji at end when no textarea ref', () => {
    const { getValues, setValue } = makeRhf('Hello')
    const { result } = renderHook(() => useEmojiInsert('body', getValues, setValue))

    act(() => result.current.onEmojiSelect('😊'))

    expect(setValue).toHaveBeenCalledWith(
      'body',
      'Hello😊',
      expect.objectContaining({ shouldValidate: true, shouldDirty: true }),
    )
  })

  it('onEmojiSelect inserts emoji at start of empty string', () => {
    const { getValues, setValue } = makeRhf('')
    const { result } = renderHook(() => useEmojiInsert('body', getValues, setValue))

    act(() => result.current.onEmojiSelect('👋'))

    expect(setValue).toHaveBeenCalledWith('body', '👋', expect.any(Object))
  })

  it('onEmojiSelect closes the picker', () => {
    const { getValues, setValue } = makeRhf('text')
    const { result } = renderHook(() => useEmojiInsert('body', getValues, setValue))

    act(() => result.current.togglePicker())
    act(() => result.current.onEmojiSelect('✅'))

    expect(result.current.isPickerOpen).toBe(false)
  })

  it('onEmojiSelect replaces selected text', () => {
    const { getValues, setValue } = makeRhf('Hello World')
    const { result } = renderHook(() => useEmojiInsert('body', getValues, setValue))

    // Simulate cursor selecting " World" (positions 5-11)
    const textarea = document.createElement('textarea')
    textarea.value = 'Hello World'
    ;(result.current.textareaRef as React.MutableRefObject<HTMLTextAreaElement>).current = textarea
    textarea.setSelectionRange(5, 11)

    act(() => result.current.onEmojiSelect('🎉'))

    expect(setValue).toHaveBeenCalledWith('body', 'Hello🎉', expect.any(Object))
  })
})
