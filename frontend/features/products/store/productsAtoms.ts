'use client'
import { atom } from 'jotai'
import type { ProductFilters } from '../types'

// Editing an existing product happens inline on the product's own detail page — this atom only
// ever drives the "+ New" creation flow now.
export const isProductFormOpenAtom = atom<boolean>(false)

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  search: '',
  is_active: null,
  page: 1,
  page_size: 20,
}

export const productFiltersAtom = atom<ProductFilters>({ ...DEFAULT_PRODUCT_FILTERS })
