import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { createStore } from 'jotai'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { setModuleToken, getModuleToken } from '@/shared/utils/apiClient'
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
  const futureExp = Math.floor(Date.now() / 1000) + 3600
  return `header.${btoa(JSON.stringify({ exp: futureExp, ...payload }))}.signature`
}

describe('authAtoms', () => {
  beforeEach(() => {
    setModuleToken(null)
    document.cookie = 'access_token=; max-age=0'
  })

  it('setTokensAtom decodes and sets the admin role', () => {
    const store = createStore()
    const token = makeToken({ sub: 'u1', role: 'system_admin', sys_admin: true })

    store.set(setTokensAtom, { access: token })

    expect(store.get(userRoleAtom)).toBe('system_admin')
    expect(store.get(isAdminAtom)).toBe(true)
    expect(store.get(currentUserIdAtom)).toBe('u1')
    expect(getModuleToken()).toBe(token)
  })

  it('setTokensAtom sets a non-admin role', () => {
    const store = createStore()
    const token = makeToken({ sub: 'u2', role: 'user', sys_admin: false })

    store.set(setTokensAtom, { access: token })

    expect(store.get(userRoleAtom)).toBe('user')
    expect(store.get(isAdminAtom)).toBe(false)
  })

  it('clearTokensAtom resets role and token', () => {
    const store = createStore()
    store.set(setTokensAtom, {
      access: makeToken({ sub: 'u1', role: 'system_admin', sys_admin: true }),
    })

    store.set(clearTokensAtom)

    expect(store.get(accessTokenAtom)).toBeNull()
    expect(store.get(userRoleAtom)).toBeNull()
    expect(store.get(isAdminAtom)).toBe(false)
    expect(getModuleToken()).toBeNull()
  })

  it('initAuthAtom fast-path: reads role from cookie when token is valid', async () => {
    const store = createStore()
    const token = makeToken({ sub: 'u3', role: 'system_admin', sys_admin: true })
    document.cookie = `access_token=${encodeURIComponent(token)}`

    await store.set(initAuthAtom)

    expect(store.get(userRoleAtom)).toBe('system_admin')
    expect(store.get(currentUserIdAtom)).toBe('u3')
    expect(getModuleToken()).toBe(token)
  })

  it('initAuthAtom slow-path: calls refresh when cookie is absent', async () => {
    const store = createStore()
    const newToken = makeToken({ sub: 'u4', role: 'user', sys_admin: false })
    server.use(
      http.post(API_ENDPOINTS.AUTH_REFRESH, () =>
        HttpResponse.json({ access_token: newToken })
      )
    )

    await store.set(initAuthAtom)

    expect(store.get(userRoleAtom)).toBe('user')
    expect(getModuleToken()).toBe(newToken)
  })

  it('initAuthAtom slow-path: leaves state null when refresh returns 401', async () => {
    const store = createStore()
    server.use(
      http.post(API_ENDPOINTS.AUTH_REFRESH, () =>
        HttpResponse.json({ detail: 'expired' }, { status: 401 })
      )
    )

    await store.set(initAuthAtom)

    expect(store.get(accessTokenAtom)).toBeNull()
    expect(store.get(userRoleAtom)).toBeNull()
  })

  it('decodes role as null for a malformed token', () => {
    const store = createStore()
    store.set(setTokensAtom, { access: 'not-a-jwt' })

    expect(store.get(userRoleAtom)).toBeNull()
    expect(store.get(isAdminAtom)).toBe(false)
  })
})
