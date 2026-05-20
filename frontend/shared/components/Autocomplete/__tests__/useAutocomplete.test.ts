import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useAutocomplete } from '../useAutocomplete'
import type { AutocompleteOption } from '../useAutocomplete'

const OPTIONS: AutocompleteOption[] = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
  { value: '3', label: 'Cherry' },
]

const mkChangeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>

const mkKeyEvent = (key: string) =>
  ({ key, preventDefault: vi.fn() }) as unknown as KeyboardEvent<HTMLInputElement>

const buildHook = (overrides: Partial<Parameters<typeof useAutocomplete>[0]> = {}) =>
  renderHook(() =>
    useAutocomplete({
      value: null,
      onChange: vi.fn(),
      options: OPTIONS,
      onSearch: vi.fn(),
      ...overrides,
    })
  )

describe('useAutocomplete', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('initializes with empty input and closed dropdown', () => {
    const { result } = buildHook()
    expect(result.current.inputValue).toBe('')
    expect(result.current.isOpen).toBe(false)
    expect(result.current.highlightedIndex).toBe(-1)
  })

  it('shows matching label when value is set with options', () => {
    const { result } = buildHook({ value: '2' })
    expect(result.current.inputValue).toBe('Banana')
  })

  it('shows defaultLabel when value set but no match in options', () => {
    const { result } = buildHook({ value: 'unknown-id', options: [], defaultLabel: 'Existing Item' })
    expect(result.current.inputValue).toBe('Existing Item')
  })

  it('updates inputValue reactively when value changes', () => {
    const onSearch = vi.fn()
    const { result, rerender } = renderHook(
      ({ value }: { value: string | null }) =>
        useAutocomplete({ value, onChange: vi.fn(), options: OPTIONS, onSearch }),
      { initialProps: { value: null } }
    )
    expect(result.current.inputValue).toBe('')
    act(() => { rerender({ value: '2' }) })
    expect(result.current.inputValue).toBe('Banana')
  })

  it('onInputChange opens dropdown and debounces onSearch by 300ms', () => {
    const onSearch = vi.fn()
    const { result } = buildHook({ onSearch })

    act(() => { result.current.onInputChange(mkChangeEvent('app')) })

    expect(result.current.inputValue).toBe('app')
    expect(result.current.isOpen).toBe(true)
    expect(onSearch).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(300) })
    expect(onSearch).toHaveBeenCalledWith('app')
  })

  it('onOptionSelect closes dropdown and calls onChange; inputValue reflects updated value', () => {
    const onChange = vi.fn()
    // renderHook with reactive value so parent can update after onChange fires
    const { result, rerender } = renderHook(
      ({ value }: { value: string | null }) =>
        useAutocomplete({ value, onChange, options: OPTIONS, onSearch: vi.fn() }),
      { initialProps: { value: null } }
    )
    act(() => { result.current.onInputChange(mkChangeEvent('ban')) })
    act(() => { result.current.onOptionSelect(OPTIONS[1]) })
    expect(onChange).toHaveBeenCalledWith('2', OPTIONS[1])
    expect(result.current.isOpen).toBe(false)
    // Simulate parent updating the value prop after onChange fires
    act(() => { rerender({ value: '2' }) })
    expect(result.current.inputValue).toBe('Banana')
  })

  it('ArrowDown when closed opens dropdown with first item highlighted', () => {
    const { result } = buildHook()
    act(() => { result.current.onKeyDown(mkKeyEvent('ArrowDown')) })
    expect(result.current.isOpen).toBe(true)
    expect(result.current.highlightedIndex).toBe(0)
  })

  it('ArrowDown/Up navigates options', () => {
    const { result } = buildHook()
    act(() => { result.current.onKeyDown(mkKeyEvent('ArrowDown')) }) // open, highlight=0
    act(() => { result.current.onKeyDown(mkKeyEvent('ArrowDown')) }) // highlight=1
    expect(result.current.highlightedIndex).toBe(1)
    act(() => { result.current.onKeyDown(mkKeyEvent('ArrowUp')) })   // highlight=0
    expect(result.current.highlightedIndex).toBe(0)
  })

  it('Enter selects highlighted option', () => {
    const onChange = vi.fn()
    const { result } = buildHook({ onChange })
    act(() => { result.current.onKeyDown(mkKeyEvent('ArrowDown')) }) // open, highlight=0
    act(() => { result.current.onKeyDown(mkKeyEvent('ArrowDown')) }) // highlight=1
    act(() => { result.current.onKeyDown(mkKeyEvent('Enter')) })
    expect(onChange).toHaveBeenCalledWith('2', OPTIONS[1])
  })

  it('Escape closes dropdown and reverts to selected label', () => {
    const { result } = buildHook({ value: '1' }) // Apple selected
    act(() => { result.current.onInputChange(mkChangeEvent('xyz')) })
    expect(result.current.inputValue).toBe('xyz')
    act(() => { result.current.onKeyDown(mkKeyEvent('Escape')) })
    expect(result.current.isOpen).toBe(false)
    expect(result.current.inputValue).toBe('Apple') // derived from value='1'
  })

  it('onBlur closes dropdown and reverts to selected label after 150ms', () => {
    const { result } = buildHook({ value: '1' }) // Apple selected
    act(() => { result.current.onInputChange(mkChangeEvent('xyz')) })
    act(() => { result.current.onBlur() })
    expect(result.current.isOpen).toBe(true) // not closed yet
    act(() => { vi.advanceTimersByTime(150) })
    expect(result.current.isOpen).toBe(false)
    expect(result.current.inputValue).toBe('Apple')
  })
})
