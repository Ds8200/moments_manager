'use client'
import { atom } from 'jotai'
import type { OrderFilters } from '../types'

export const DEFAULT_FILTERS: OrderFilters = {
  search: '',
  status: '',
  payment_state: '',
  date_from: '',
  date_to: '',
  page: 1,
  page_size: 20,
}

export const orderFiltersAtom = atom<OrderFilters>({ ...DEFAULT_FILTERS })

export const selectedOrderIdAtom = atom<string | null>(null)

export const isOrderFormOpenAtom = atom<boolean>(false)

export const editingOrderIdAtom = atom<string | null>(null)
