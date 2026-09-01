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
  sort_by: 'created_at',
}

export const orderFiltersAtom = atom<OrderFilters>({ ...DEFAULT_FILTERS })

// Editing an existing order happens inline on the order's own detail page — this atom only ever
// drives the "+ New" creation flow now.
export const isOrderFormOpenAtom = atom<boolean>(false)
