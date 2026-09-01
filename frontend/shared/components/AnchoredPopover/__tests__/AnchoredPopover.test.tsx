import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AnchoredPopover } from '../AnchoredPopover'
import type { AnchoredPopoverState } from '../useAnchoredPopover'

const OPEN_STATE: AnchoredPopoverState<string> = {
  isOpen: true,
  data: 'hello popover',
  anchorX: 10,
  anchorY: 20,
  anchorWidth: 30,
  anchorHeight: 40,
}

const CLOSED_STATE: AnchoredPopoverState<string> = { isOpen: false }

describe('AnchoredPopover', () => {
  it('renders nothing when closed', () => {
    render(
      <AnchoredPopover state={CLOSED_STATE} onClose={vi.fn()}>
        {(data) => <span>{data}</span>}
      </AnchoredPopover>
    )

    expect(screen.queryByText('hello popover')).not.toBeInTheDocument()
  })

  it('renders the children with the open state data', () => {
    render(
      <AnchoredPopover state={OPEN_STATE} onClose={vi.fn()}>
        {(data) => <span>{data}</span>}
      </AnchoredPopover>
    )

    expect(screen.getByText('hello popover')).toBeInTheDocument()
  })

  it('calls onClose when the overlay is clicked', async () => {
    const onClose = vi.fn()
    render(
      <AnchoredPopover state={OPEN_STATE} onClose={onClose}>
        {(data) => <span>{data}</span>}
      </AnchoredPopover>
    )

    // The overlay is the sibling element rendered alongside the popover content in the portal.
    const overlay = document.querySelector('[class*="overlay"]')
    expect(overlay).not.toBeNull()
    await userEvent.click(overlay as Element)

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    render(
      <AnchoredPopover state={OPEN_STATE} onClose={onClose}>
        {(data) => <span>{data}</span>}
      </AnchoredPopover>
    )

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })
})
