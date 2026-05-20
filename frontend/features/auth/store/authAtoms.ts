'use client'
import { atom } from 'jotai'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

function readToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export const accessTokenAtom = atom<string | null>(null)

export const isAuthenticatedAtom = atom((get) => get(accessTokenAtom) !== null)

export const setTokensAtom = atom(
  null,
  (_get, set, { access, refresh }: { access: string; refresh: string }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    set(accessTokenAtom, access)
  },
)

export const clearTokensAtom = atom(null, (_get, set) => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  set(accessTokenAtom, null)
})

export const initAuthAtom = atom(null, (_get, set) => {
  const token = readToken()
  set(accessTokenAtom, token)
})
