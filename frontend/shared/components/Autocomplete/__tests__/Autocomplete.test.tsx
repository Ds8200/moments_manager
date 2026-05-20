import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { Autocomplete } from '../Autocomplete'
import type { AutocompleteOption } from '../useAutocomplete'

const OPTIONS: AutocompleteOption[] = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
]

const buildProps = (overrides = {}) => ({
  value: null,
  onChange: vi.fn(),
  options: OPTIONS,
  onSearch: vi.fn(),
  ...overrides,
})

describe('Autocomplete', () => {
  it('renders label and placeholder', () => {
    render(
      <Autocomplete {...buildProps({ label: 'פרי', placeholder: 'חפש פרי...' })} />
    )
    expect(screen.getByText('פרי')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('חפש פרי...')).toBeInTheDocument()
  })

  it('shows dropdown with options on focus', async () => {
    render(<Autocomplete {...buildProps()} />)
    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
  })

  it('shows loading state when isLoading is true', async () => {
    render(<Autocomplete {...buildProps({ isLoading: true, options: [] })} />)
    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('טוען...')).toBeInTheDocument()
  })

  it('shows no-results message when options is empty', async () => {
    render(<Autocomplete {...buildProps({ options: [] })} />)
    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('לא נמצאו תוצאות')).toBeInTheDocument()
  })

  it('calls onChange when option is clicked', () => {
    const onChange = vi.fn()
    render(<Autocomplete {...buildProps({ onChange })} />)
    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.mouseDown(screen.getByText('Banana'))
    expect(onChange).toHaveBeenCalledWith('2', OPTIONS[1])
  })

  it('displays error message', () => {
    render(<Autocomplete {...buildProps({ error: 'שדה חובה' })} />)
    expect(screen.getByText('שדה חובה')).toBeInTheDocument()
  })
})
