'use client'
import { atom } from 'jotai'
import type { CustomerFilters } from '../types'

// Editing an existing customer happens inline on the customer's own detail page — this atom only
// ever drives the "+ New" creation flow now.
export const isCustomerFormOpenAtom = atom<boolean>(false)

export const DEFAULT_CUSTOMER_FILTERS: CustomerFilters = {
  search: '',
  page: 1,
  page_size: 20,
}

export const customerFiltersAtom = atom<CustomerFilters>({ ...DEFAULT_CUSTOMER_FILTERS })
