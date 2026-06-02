import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai'
import { addToastAtom, removeToastAtom, toastsAtom } from '../globalAtoms'
import { NOTIFICATION_TYPE } from '../../enums/notificationEnums'

describe('toast atoms', () => {
  it('adds a toast with a generated id', () => {
    const store = createStore()
    store.set(addToastAtom, { type: NOTIFICATION_TYPE.SUCCESS, message: 'ok' })

    const toasts = store.get(toastsAtom)
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('ok')
    expect(toasts[0].type).toBe(NOTIFICATION_TYPE.SUCCESS)
    expect(toasts[0].id).toBeTruthy()
  })

  it('removes a toast by id', () => {
    const store = createStore()
    store.set(addToastAtom, { type: NOTIFICATION_TYPE.ERROR, message: 'boom' })
    const id = store.get(toastsAtom)[0].id

    store.set(removeToastAtom, id)

    expect(store.get(toastsAtom)).toHaveLength(0)
  })

  it('caps the stack at 4 toasts, dropping the oldest', () => {
    const store = createStore()
    for (let i = 0; i < 6; i++) {
      store.set(addToastAtom, { type: NOTIFICATION_TYPE.INFO, message: `m${i}` })
    }

    const toasts = store.get(toastsAtom)
    expect(toasts).toHaveLength(4)
    expect(toasts.map((t) => t.message)).toEqual(['m2', 'm3', 'm4', 'm5'])
  })
})
