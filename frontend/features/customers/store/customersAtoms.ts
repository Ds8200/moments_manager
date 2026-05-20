'use client'
import { atom } from 'jotai'

export const isCustomerFormOpenAtom = atom<boolean>(false)
export const editingCustomerIdAtom = atom<string | null>(null)
