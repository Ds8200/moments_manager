import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FiltersBar } from '../FiltersBar'
import type { FiltersBarProps } from '../useFiltersBar'
import { UI_LABELS } from '@/shared/constants/uiLabels'

const buildProps = (overrides: Partial<FiltersBarProps> = {}): FiltersBarProps => ({
  searchValue: '',
  searchPlaceholder: 'חיפוש...',
  onSearchChange: vi.fn(),
  ...overrides,
})

const statusSelect = {
  value: '',
  options: [
    { value: '', label: 'כל הסטטוסים' },
    { value: 'open', label: 'פתוח' },
  ],
  onChange: vi.fn(),
}

const toggleName = new RegExp(UI_LABELS.FILTERS_TOGGLE)

describe('FiltersBar', () => {
  it('always renders the search input', () => {
    render(<FiltersBar {...buildProps()} />)
    expect(screen.getByPlaceholderText('חיפוש...')).toBeInTheDocument()
  })

  it('forwards search input changes', async () => {
    const onSearchChange = vi.fn()
    render(<FiltersBar {...buildProps({ onSearchChange })} />)

    await userEvent.type(screen.getByPlaceholderText('חיפוש...'), 'a')
    expect(onSearchChange).toHaveBeenCalledWith('a')
  })

  it('does not render the toggle when there are no collapsible controls', () => {
    render(<FiltersBar {...buildProps()} />)
    expect(screen.queryByRole('button', { name: toggleName })).toBeNull()
  })

  it('renders the toggle and the controls when collapsible controls exist', () => {
    render(<FiltersBar {...buildProps({ selects: [statusSelect] })} />)
    expect(screen.getByRole('button', { name: toggleName })).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('toggle flips aria-expanded and the controls data-expanded flag', async () => {
    const { container } = render(<FiltersBar {...buildProps({ selects: [statusSelect] })} />)
    const toggle = screen.getByRole('button', { name: toggleName })
    const controls = container.querySelector('[data-expanded]')

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(controls).toHaveAttribute('data-expanded', 'false')

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(controls).toHaveAttribute('data-expanded', 'true')
  })

  it('shows the active-filter count on the toggle when a select is off its first option', () => {
    render(<FiltersBar {...buildProps({ selects: [{ ...statusSelect, value: 'open' }] })} />)
    expect(
      screen.getByRole('button', { name: new RegExp(`${UI_LABELS.FILTERS_TOGGLE}.*1`) })
    ).toBeInTheDocument()
  })
})
