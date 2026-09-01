import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AnchoredPopover } from '../AnchoredPopover'
import type { AnchoredPopoverState } from '../useAnchoredPopover'

const ANCHOR_EL = document.createElement('button')

const OPEN_STATE: AnchoredPopoverState<string> = {
  isOpen: true,
  data: 'hello popover',
  anchorEl: ANCHOR_EL,
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

  it('recomputes position on scroll while open', () => {
    const rectSpy = vi
      .spyOn(ANCHOR_EL, 'getBoundingClientRect')
      .mockReturnValue({ top: 10, bottom: 30, left: 10, right: 60, width: 50, height: 20, x: 10, y: 10, toJSON: () => ({}) })

    render(
      <AnchoredPopover state={OPEN_STATE} onClose={vi.fn()}>
        {(data) => <span>{data}</span>}
      </AnchoredPopover>
    )
    const callsAfterMount = rectSpy.mock.calls.length

    window.dispatchEvent(new Event('scroll'))

    expect(rectSpy.mock.calls.length).toBeGreaterThan(callsAfterMount)
    rectSpy.mockRestore()
  })
})
