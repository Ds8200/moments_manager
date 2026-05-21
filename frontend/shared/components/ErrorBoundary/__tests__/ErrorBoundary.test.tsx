import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ErrorBoundary } from '../ErrorBoundary'
import { UI_LABELS } from '@/shared/constants/uiLabels'

describe('ErrorBoundary', () => {
  it('renders default title and try-again button', () => {
    render(<ErrorBoundary onReset={vi.fn()} />)
    expect(screen.getByText(UI_LABELS.ERROR_TITLE)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: UI_LABELS.TRY_AGAIN })).toBeInTheDocument()
  })

  it('renders custom message when provided', () => {
    render(<ErrorBoundary message={UI_LABELS.ERROR_LOADING_ORDERS} onReset={vi.fn()} />)
    expect(screen.getByText(UI_LABELS.ERROR_LOADING_ORDERS)).toBeInTheDocument()
  })

  it('renders custom title when provided', () => {
    const customTitle = UI_LABELS.ERROR_LOADING_CUSTOMERS
    render(<ErrorBoundary title={customTitle} onReset={vi.fn()} />)
    expect(screen.getByText(customTitle)).toBeInTheDocument()
  })

  it('calls onReset when try-again button is clicked', () => {
    const onReset = vi.fn()
    render(<ErrorBoundary onReset={onReset} />)
    fireEvent.click(screen.getByRole('button', { name: UI_LABELS.TRY_AGAIN }))
    expect(onReset).toHaveBeenCalledOnce()
  })
})
