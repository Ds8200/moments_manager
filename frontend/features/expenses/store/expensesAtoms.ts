'use client'
import { atom } from 'jotai'
import type { Expense } from '../types'

export const isExpenseFormOpenAtom = atom<boolean>(false)
export const editingExpenseAtom = atom<Expense | null>(null)
export const expensesPageAtom = atom<number>(1)
