import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FiltersBarControls } from '../FiltersBarControls'
import type { FiltersBarControlsProps } from '../useFiltersBarControls'

const buildProps = (overrides: Partial<FiltersBarControlsProps> = {}): FiltersBarControlsProps => ({
  selects: [],
  showDates: false,
  dateFrom: '',
  dateTo: '',
  dateFromLabel: '',
  dateToLabel: '',
  onDateFromChange: vi.fn(),
  onDateToChange: vi.fn(),
  ...overrides,
})

describe('FiltersBarControls', () => {
  it('renders one select per config and forwards its change', async () => {
    const onChange = vi.fn()
    render(
      <FiltersBarControls
        {...buildProps({
          selects: [
            {
              value: '',
              options: [
                { value: '', label: 'הכל' },
                { value: 'open', label: 'פתוח' },
              ],
              onChange,
            },
          ],
        })}
      />
    )

    await userEvent.selectOptions(screen.getByRole('combobox'), 'open')
    expect(onChange).toHaveBeenCalledWith('open')
  })

  it('renders the date range with labels when showDates is true', () => {
    render(
      <FiltersBarControls
        {...buildProps({
          showDates: true,
          dateFromLabel: 'מתאריך',
          dateToLabel: 'עד תאריך',
        })}
      />
    )

    expect(screen.getByText('מתאריך')).toBeInTheDocument()
    expect(screen.getByText('עד תאריך')).toBeInTheDocument()
  })

  it('omits the date range when showDates is false', () => {
    const { container } = render(<FiltersBarControls {...buildProps()} />)
    expect(container.querySelector('input[type="date"]')).toBeNull()
  })
})
