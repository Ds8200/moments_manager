import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DropdownMenu } from '../DropdownMenu'
import type { DropdownMenuState } from '../useDropdownMenu'

const CLOSED_STATE: DropdownMenuState = {
  isOpen: false,
  title: '',
  items: [],
  anchorX: 0,
  anchorY: 0,
  anchorWidth: 0,
  anchorHeight: 0,
}

function makeOpenState(overrides: Partial<DropdownMenuState> = {}): DropdownMenuState {
  return {
    isOpen: true,
    title: 'דניאל',
    items: [
      { label: 'עריכה', icon: '✏️', onClick: vi.fn() },
      { label: 'מחיקה', icon: '🗑️', onClick: vi.fn(), variant: 'danger' },
    ],
    anchorX: 10,
    anchorY: 10,
    anchorWidth: 100,
    anchorHeight: 40,
    ...overrides,
  }
}

describe('DropdownMenu', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<DropdownMenu state={CLOSED_STATE} onClose={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the title and every item when open', () => {
    render(<DropdownMenu state={makeOpenState()} onClose={vi.fn()} />)

    expect(screen.getByText('דניאל')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /עריכה/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /מחיקה/ })).toBeInTheDocument()
  })

  it('clicking an item calls its onClick and closes the menu', async () => {
    const onClose = vi.fn()
    const state = makeOpenState()
    render(<DropdownMenu state={state} onClose={onClose} />)

    await userEvent.click(screen.getByRole('menuitem', { name: /עריכה/ }))

    expect(state.items[0].onClick).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('a danger-variant item gets the danger styling class', () => {
    render(<DropdownMenu state={makeOpenState()} onClose={vi.fn()} />)

    const deleteItem = screen.getByRole('menuitem', { name: /מחיקה/ })
    expect(deleteItem.className).toMatch(/menuItemDanger/)
  })

  it('clicking the overlay closes the menu without firing an item action', async () => {
    const onClose = vi.fn()
    const state = makeOpenState()
    render(<DropdownMenu state={state} onClose={onClose} />)

    // rendered via createPortal into document.body — not inside the render() container
    const overlay = document.body.querySelector('[class*="overlay"]')
    expect(overlay).not.toBeNull()
    await userEvent.click(overlay as Element)

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(state.items[0].onClick).not.toHaveBeenCalled()
    expect(state.items[1].onClick).not.toHaveBeenCalled()
  })

  it('pressing Escape closes the menu', async () => {
    const onClose = vi.fn()
    render(<DropdownMenu state={makeOpenState()} onClose={onClose} />)

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not respond to Escape when already closed', async () => {
    const onClose = vi.fn()
    render(<DropdownMenu state={CLOSED_STATE} onClose={onClose} />)

    await userEvent.keyboard('{Escape}')

    expect(onClose).not.toHaveBeenCalled()
  })
})
