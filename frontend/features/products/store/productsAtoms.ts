'use client'
import { atom } from 'jotai'
import type { ProductFilters } from '../types'

export const isProductFormOpenAtom = atom<boolean>(false)
export const editingProductIdAtom = atom<string | null>(null)

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  search: '',
  is_active: null,
  page: 1,
  page_size: 20,
}

export const productFiltersAtom = atom<ProductFilters>({ ...DEFAULT_PRODUCT_FILTERS })
