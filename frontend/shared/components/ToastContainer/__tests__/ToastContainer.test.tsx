import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createStore, Provider } from 'jotai'
import { ToastContainer } from '../ToastContainer'
import { addToastAtom } from '@/shared/store/globalAtoms'
import { NOTIFICATION_TYPE } from '@/shared/enums/notificationEnums'
import { TOAST_LABELS } from '@/shared/constants/uiLabels'

const renderWithStore = (store: ReturnType<typeof createStore>): void => {
  render(React.createElement(Provider, { store }, React.createElement(ToastContainer)))
}

describe('ToastContainer', () => {
  it('renders the region with no toasts initially', () => {
    const store = createStore()
    renderWithStore(store)
    expect(screen.getByRole('region', { name: TOAST_LABELS.REGION })).toBeDefined()
  })

  it('renders a toast item for each toast in the store', () => {
    const store = createStore()
    store.set(addToastAtom, { type: NOTIFICATION_TYPE.SUCCESS, message: 'first' })
    store.set(addToastAtom, { type: NOTIFICATION_TYPE.ERROR, message: 'second' })

    renderWithStore(store)

    expect(screen.getByText('first')).toBeDefined()
    expect(screen.getByText('second')).toBeDefined()
    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByRole('status')).toBeDefined()
  })
})
