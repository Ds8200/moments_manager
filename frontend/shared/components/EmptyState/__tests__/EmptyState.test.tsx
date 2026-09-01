import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EmptyState } from '../EmptyState'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'

describe('EmptyState', () => {
  it('renders the title and default icon', () => {
    render(<EmptyState title="אין תוצאות" />)

    expect(screen.getByText('אין תוצאות')).toBeInTheDocument()
    expect(screen.getByText(UI_SYMBOLS.EMPTY_MAILBOX)).toBeInTheDocument()
  })

  it('renders a custom icon when provided', () => {
    render(<EmptyState title="אין תוצאות" icon="📦" />)
    expect(screen.getByText('📦')).toBeInTheDocument()
  })

  it('omits the description when not provided', () => {
    render(<EmptyState title="אין תוצאות" />)
    expect(screen.queryByText('תיאור')).not.toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(<EmptyState title="אין תוצאות" description="נסה שוב מאוחר יותר" />)
    expect(screen.getByText('נסה שוב מאוחר יותר')).toBeInTheDocument()
  })

  it('renders the action node when provided', () => {
    render(<EmptyState title="אין תוצאות" action={<button>נסה שוב</button>} />)
    expect(screen.getByRole('button', { name: 'נסה שוב' })).toBeInTheDocument()
  })

  it('omits the action wrapper when not provided', () => {
    const { container } = render(<EmptyState title="אין תוצאות" />)
    expect(container.querySelector('button')).toBeNull()
  })
})
