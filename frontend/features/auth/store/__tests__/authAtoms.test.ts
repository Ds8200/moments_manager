import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai'
import {
  accessTokenAtom,
  userRoleAtom,
  isAdminAtom,
  currentUserIdAtom,
  setTokensAtom,
  clearTokensAtom,
  initAuthAtom,
} from '../authAtoms'

function makeToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

describe('authAtoms', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('setTokensAtom decodes and sets the admin role', () => {
    const store = createStore()
    const token = makeToken({ sub: 'u1', role: 'system_admin', sys_admin: true })

    store.set(setTokensAtom, { access: token, refresh: 'r' })

    expect(store.get(userRoleAtom)).toBe('system_admin')
    expect(store.get(isAdminAtom)).toBe(true)
    expect(store.get(currentUserIdAtom)).toBe('u1')
  })

  it('setTokensAtom sets a non-admin role', () => {
    const store = createStore()
    const token = makeToken({ sub: 'u2', role: 'user', sys_admin: false })

    store.set(setTokensAtom, { access: token, refresh: 'r' })

    expect(store.get(userRoleAtom)).toBe('user')
    expect(store.get(isAdminAtom)).toBe(false)
  })

  it('clearTokensAtom resets role and token', () => {
    const store = createStore()
    store.set(setTokensAtom, {
      access: makeToken({ sub: 'u1', role: 'system_admin', sys_admin: true }),
      refresh: 'r',
    })

    store.set(clearTokensAtom)

    expect(store.get(accessTokenAtom)).toBeNull()
    expect(store.get(userRoleAtom)).toBeNull()
    expect(store.get(isAdminAtom)).toBe(false)
  })

  it('initAuthAtom reads role from the stored token', () => {
    const store = createStore()
    localStorage.setItem(
      'access_token',
      makeToken({ sub: 'u3', role: 'system_admin', sys_admin: true }),
    )

    store.set(initAuthAtom)

    expect(store.get(userRoleAtom)).toBe('system_admin')
    expect(store.get(currentUserIdAtom)).toBe('u3')
  })

  it('decodes role as null for a malformed token', () => {
    const store = createStore()
    store.set(setTokensAtom, { access: 'not-a-jwt', refresh: 'r' })

    expect(store.get(userRoleAtom)).toBeNull()
    expect(store.get(isAdminAtom)).toBe(false)
  })
})
