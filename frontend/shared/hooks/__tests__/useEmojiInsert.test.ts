import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useEmojiInsert } from '../useEmojiInsert'

function makeRhf(subjectInitial = '', bodyInitial = '') {
  const stored: Record<string, string> = { subject: subjectInitial, body: bodyInitial }
  const getValues = vi.fn((field: string) => stored[field] ?? '')
  const setValue = vi.fn((field: string, value: string) => { stored[field] = value })
  return { getValues, setValue, getStored: () => ({ ...stored }) }
}

describe('useEmojiInsert', () => {
  it('starts with picker closed', () => {
    const { getValues, setValue } = makeRhf()
    const { result } = renderHook(() => useEmojiInsert('subject', 'body', getValues, setValue))
    expect(result.current.isPickerOpen).toBe(false)
  })

  it('togglePicker opens and closes the picker', () => {
    const { getValues, setValue } = makeRhf()
    const { result } = renderHook(() => useEmojiInsert('subject', 'body', getValues, setValue))

    act(() => result.current.togglePicker())
    expect(result.current.isPickerOpen).toBe(true)

    act(() => result.current.togglePicker())
    expect(result.current.isPickerOpen).toBe(false)
  })

  it('closePicker closes the picker', () => {
    const { getValues, setValue } = makeRhf()
    const { result } = renderHook(() => useEmojiInsert('subject', 'body', getValues, setValue))

    act(() => result.current.togglePicker())
    act(() => result.current.closePicker())
    expect(result.current.isPickerOpen).toBe(false)
  })

  it('onEmojiSelect inserts emoji into body (default active field) at end when no ref', () => {
    const { getValues, setValue } = makeRhf('', 'Hello')
    const { result } = renderHook(() => useEmojiInsert('subject', 'body', getValues, setValue))

    act(() => result.current.onEmojiSelect('😊'))

    expect(setValue).toHaveBeenCalledWith(
      'body',
      'Hello😊',
      expect.objectContaining({ shouldValidate: true, shouldDirty: true }),
    )
  })

  it('onEmojiSelect inserts emoji into subject when subject is active', () => {
    const { getValues, setValue } = makeRhf('Hi', '')
    const { result } = renderHook(() => useEmojiInsert('subject', 'body', getValues, setValue))

    act(() => result.current.onSubjectFocus())
    act(() => result.current.onEmojiSelect('👋'))

    expect(setValue).toHaveBeenCalledWith('subject', 'Hi👋', expect.any(Object))
  })

  it('onEmojiSelect keeps picker open', () => {
    const { getValues, setValue } = makeRhf('', 'text')
    const { result } = renderHook(() => useEmojiInsert('subject', 'body', getValues, setValue))

    act(() => result.current.togglePicker())
    act(() => result.current.onEmojiSelect('✅'))

    expect(result.current.isPickerOpen).toBe(true)
  })

  it('onBodyFocus switches active field back to body', () => {
    const { getValues, setValue } = makeRhf('Subject', 'Body')
    const { result } = renderHook(() => useEmojiInsert('subject', 'body', getValues, setValue))

    act(() => result.current.onSubjectFocus())
    act(() => result.current.onBodyFocus())
    act(() => result.current.onEmojiSelect('🎉'))

    expect(setValue).toHaveBeenCalledWith('body', 'Body🎉', expect.any(Object))
  })

  it('onEmojiSelect replaces selected text in body', () => {
    const { getValues, setValue } = makeRhf('', 'Hello World')
    const { result } = renderHook(() => useEmojiInsert('subject', 'body', getValues, setValue))

    // Simulate cursor selecting " World" (positions 5-11)
    const textarea = document.createElement('textarea')
    textarea.value = 'Hello World'
    ;(result.current.textareaRef as React.MutableRefObject<HTMLTextAreaElement>).current = textarea
    textarea.setSelectionRange(5, 11)

    act(() => result.current.onEmojiSelect('🎉'))

    expect(setValue).toHaveBeenCalledWith('body', 'Hello🎉', expect.any(Object))
  })

  it('onEmojiSelect replaces selected text in subject', () => {
    const { getValues, setValue } = makeRhf('Hello World', '')
    const { result } = renderHook(() => useEmojiInsert('subject', 'body', getValues, setValue))

    act(() => result.current.onSubjectFocus())

    const input = document.createElement('input')
    input.value = 'Hello World'
    ;(result.current.subjectRef as React.MutableRefObject<HTMLInputElement>).current = input
    input.setSelectionRange(5, 11)

    act(() => result.current.onEmojiSelect('🎉'))

    expect(setValue).toHaveBeenCalledWith('subject', 'Hello🎉', expect.any(Object))
  })
})
