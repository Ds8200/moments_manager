'use client'
import { atom } from 'jotai'
import type { TokenPayload, UserRole } from '../types'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

function readToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

function decodePayload(token: string): TokenPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as TokenPayload
  } catch {
    return null
  }
}

function decodeRole(token: string): UserRole | null {
  return decodePayload(token)?.role ?? null
}

export const accessTokenAtom = atom<string | null>(null)

export const isAuthenticatedAtom = atom((get) => get(accessTokenAtom) !== null)

export const userRoleAtom = atom<UserRole | null>(null)

export const isAdminAtom = atom((get) => get(userRoleAtom) === 'admin')

export const currentUserIdAtom = atom((get) => {
  const token = get(accessTokenAtom)
  return token ? (decodePayload(token)?.sub ?? null) : null
})

export const setTokensAtom = atom(
  null,
  (_get, set, { access, refresh }: { access: string; refresh: string }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    set(accessTokenAtom, access)
    set(userRoleAtom, decodeRole(access))
  },
)

export const clearTokensAtom = atom(null, (_get, set) => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  set(accessTokenAtom, null)
  set(userRoleAtom, null)
})

export const initAuthAtom = atom(null, (_get, set) => {
  const token = readToken()
  set(accessTokenAtom, token)
  set(userRoleAtom, token ? decodeRole(token) : null)
})
