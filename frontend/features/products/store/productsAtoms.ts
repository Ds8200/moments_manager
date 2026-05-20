'use client'
import { atom } from 'jotai'

export const isProductFormOpenAtom = atom<boolean>(false)
export const editingProductIdAtom = atom<string | null>(null)
