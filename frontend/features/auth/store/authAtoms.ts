'use client'
import { atom } from 'jotai'
import { getModuleToken, getOrRefreshToken, setModuleToken } from '@/shared/utils/apiClient'
import type { OrgRole, TokenPayload, UserRole } from '../types'

export function decodePayload(token: string): TokenPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as TokenPayload
  } catch {
    return null
  }
}

function decodeRole(token: string): UserRole | null {
  return decodePayload(token)?.role ?? null
}

function readCookieToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

function isTokenExpired(token: string): boolean {
  const payload = decodePayload(token)
  return !payload || payload.exp * 1000 < Date.now()
}

export const accessTokenAtom = atom<string | null>(null)

export const isAuthenticatedAtom = atom((get) => get(accessTokenAtom) !== null)

export const userRoleAtom = atom<UserRole | null>(null)

export const isSysAdminAtom = atom((get) => {
  const token = get(accessTokenAtom)
  return token ? (decodePayload(token)?.sys_admin ?? false) : false
})

// Kept for backwards-compat; routes that checked isAdminAtom now use isSysAdminAtom
export const isAdminAtom = isSysAdminAtom

export const currentUserIdAtom = atom((get) => {
  const token = get(accessTokenAtom)
  return token ? (decodePayload(token)?.sub ?? null) : null
})

export const currentOrgIdAtom = atom((get) => {
  const token = get(accessTokenAtom)
  return token ? (decodePayload(token)?.org_id ?? null) : null
})

export const currentOrgRoleAtom = atom<OrgRole | null>((get) => {
  const token = get(accessTokenAtom)
  return token ? (decodePayload(token)?.org_role ?? null) : null
})

export const setTokensAtom = atom(
  null,
  (_get, set, { access }: { access: string }) => {
    setModuleToken(access)
    set(accessTokenAtom, access)
    set(userRoleAtom, decodeRole(access))
  },
)

export const clearTokensAtom = atom(null, (_get, set) => {
  setModuleToken(null)
  set(accessTokenAtom, null)
  set(userRoleAtom, null)
})

export const initAuthAtom = atom(null, async (_get, set) => {
  // Fast path: access_token cookie is still valid — no network call needed
  const cookieToken = readCookieToken()
  if (cookieToken && !isTokenExpired(cookieToken)) {
    setModuleToken(cookieToken)
    set(accessTokenAtom, cookieToken)
    set(userRoleAtom, decodeRole(cookieToken))
    return
  }

  // Slow path: use httpOnly refresh_token cookie to silently issue a new pair
  const existingModuleToken = getModuleToken()
  if (existingModuleToken && !isTokenExpired(existingModuleToken)) {
    set(accessTokenAtom, existingModuleToken)
    set(userRoleAtom, decodeRole(existingModuleToken))
    return
  }

  const newToken = await getOrRefreshToken()
  if (newToken) {
    set(accessTokenAtom, newToken)
    set(userRoleAtom, decodeRole(newToken))
  }
  // null → remains unauthenticated; AuthGuard redirects to login
})
