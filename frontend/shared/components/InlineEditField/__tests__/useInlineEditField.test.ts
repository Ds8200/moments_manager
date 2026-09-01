import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useInlineEditField } from '../useInlineEditField'
import type { UseInlineEditFieldReturn } from '../useInlineEditField'

function makeChangeEvent(value: string): { target: { value: string } } {
  return { target: { value } }
}

function makeKeyEvent(key: string): { key: string; preventDefault: () => void } {
  return { key, preventDefault: vi.fn() }
}

type ChangeArg = Parameters<UseInlineEditFieldReturn['onDraftChange']>[0]
type KeyArg = Parameters<UseInlineEditFieldReturn['onKeyDown']>[0]

describe('useInlineEditField', () => {
  it('starts read-only, not editing', () => {
    const { result } = renderHook(() =>
      useInlineEditField({ label: 'שם', value: 'דני', type: 'text', editable: true, onSave: vi.fn() })
    )
    expect(result.current.isEditing).toBe(false)
    expect(result.current.displayValue).toBe('דני')
  })

  it('shows displayValue instead of value when provided, but edits the raw value', () => {
    const { result } = renderHook(() =>
      useInlineEditField({
        label: 'תאריך', value: '2025-01-01', displayValue: '1.1.2025',
        type: 'date', editable: true, onSave: vi.fn(),
      })
    )

    expect(result.current.displayValue).toBe('1.1.2025')

    act(() => result.current.onStartEdit())
    expect(result.current.draft).toBe('2025-01-01')
  })

  it('onStartEdit does nothing when the field is not editable', () => {
    const { result } = renderHook(() =>
      useInlineEditField({ label: 'אימייל', value: 'a@b.com', type: 'text', editable: false, onSave: vi.fn() })
    )

    act(() => result.current.onStartEdit())

    expect(result.current.isEditing).toBe(false)
  })

  it('double-click (onStartEdit) enters edit mode seeded with the current value', () => {
    const { result } = renderHook(() =>
      useInlineEditField({ label: 'שם', value: 'דני', type: 'text', editable: true, onSave: vi.fn() })
    )

    act(() => result.current.onStartEdit())

    expect(result.current.isEditing).toBe(true)
    expect(result.current.draft).toBe('דני')
  })

  it('Enter saves the changed draft and exits edit mode', () => {
    const onSave = vi.fn()
    const { result } = renderHook(() =>
      useInlineEditField({ label: 'שם', value: 'דני', type: 'text', editable: true, onSave })
    )

    act(() => result.current.onStartEdit())
    act(() => result.current.onDraftChange(makeChangeEvent('דניאל') as unknown as ChangeArg))
    act(() => result.current.onKeyDown(makeKeyEvent('Enter') as unknown as KeyArg))

    expect(onSave).toHaveBeenCalledWith('דניאל')
    expect(result.current.isEditing).toBe(false)
  })

  it('Enter does not call onSave when the draft is unchanged', () => {
    const onSave = vi.fn()
    const { result } = renderHook(() =>
      useInlineEditField({ label: 'שם', value: 'דני', type: 'text', editable: true, onSave })
    )

    act(() => result.current.onStartEdit())
    act(() => result.current.onKeyDown(makeKeyEvent('Enter') as unknown as KeyArg))

    expect(onSave).not.toHaveBeenCalled()
    expect(result.current.isEditing).toBe(false)
  })

  it('Escape reverts the draft and exits edit mode without saving', () => {
    const onSave = vi.fn()
    const { result } = renderHook(() =>
      useInlineEditField({ label: 'שם', value: 'דני', type: 'text', editable: true, onSave })
    )

    act(() => result.current.onStartEdit())
    act(() => result.current.onDraftChange(makeChangeEvent('שינוי') as unknown as ChangeArg))
    act(() => result.current.onKeyDown(makeKeyEvent('Escape') as unknown as KeyArg))

    expect(onSave).not.toHaveBeenCalled()
    expect(result.current.isEditing).toBe(false)
  })

  it('blur exits edit mode without saving', () => {
    const onSave = vi.fn()
    const { result } = renderHook(() =>
      useInlineEditField({ label: 'שם', value: 'דני', type: 'text', editable: true, onSave })
    )

    act(() => result.current.onStartEdit())
    act(() => result.current.onDraftChange(makeChangeEvent('שינוי') as unknown as ChangeArg))
    act(() => result.current.onBlur())

    expect(onSave).not.toHaveBeenCalled()
    expect(result.current.isEditing).toBe(false)
  })
})
