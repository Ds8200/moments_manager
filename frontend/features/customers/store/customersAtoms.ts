'use client'
import { atom } from 'jotai'
import type { CustomerFilters } from '../types'

export const isCustomerFormOpenAtom = atom<boolean>(false)
export const editingCustomerIdAtom = atom<string | null>(null)

export const DEFAULT_CUSTOMER_FILTERS: CustomerFilters = {
  search: '',
  page: 1,
  page_size: 20,
}

export const customerFiltersAtom = atom<CustomerFilters>({ ...DEFAULT_CUSTOMER_FILTERS })
