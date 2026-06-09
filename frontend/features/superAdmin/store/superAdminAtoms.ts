'use client'
import { atom } from 'jotai'
import type { OrgListFilters, UserListFilters } from '../types'

export const orgFiltersAtom = atom<OrgListFilters>({
  search: '',
  plan: '',
  is_active: '',
  page: 1,
  page_size: 20,
})

export const userFiltersAtom = atom<UserListFilters>({
  search: '',
  page: 1,
  page_size: 20,
})

export const isOrgFormOpenAtom = atom<boolean>(false)
export const editingOrgIdAtom = atom<string | null>(null)
export const superAdminTabAtom = atom<0 | 1>(0)
export const isUserFormModalOpenAtom = atom<boolean>(false)

export interface PendingNewUser {
  email: string
  full_name: string
  phone?: string
  password: string
}

export const pendingNewUserAtom = atom<PendingNewUser | null>(null)
