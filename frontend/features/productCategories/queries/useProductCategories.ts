'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { productCategoriesApi } from '../api'
import type { ProductCategory } from '../types'

export const PRODUCT_CATEGORIES_KEY = ['product-categories'] as const

export const useProductCategories = (): UseQueryResult<ProductCategory[]> =>
  useQuery({
    queryKey: PRODUCT_CATEGORIES_KEY,
    queryFn: () => productCategoriesApi.list(),
    staleTime: 60 * 60 * 1000,
  })

export const useCreateProductCategory = (): UseMutationResult<ProductCategory, Error, string> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => productCategoriesApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_CATEGORIES_KEY })
    },
  })
}

export const useDeleteProductCategory = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productCategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_CATEGORIES_KEY })
    },
  })
}
