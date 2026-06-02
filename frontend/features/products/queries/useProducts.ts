'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { productsApi } from '../api'
import { useNotify } from '@/shared/hooks/useNotify'
import { PRODUCTS_LABELS } from '../constants/productsLabels'
import type { Product, ProductFormValues, ProductsResponse } from '../types'

export const useProduct = (id: string | null): UseQueryResult<Product> =>
  useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.get(id!),
    enabled: id !== null,
  })

export const useProducts = (
  page = 1,
  search = '',
  isActive: boolean | null = null,
): UseQueryResult<ProductsResponse> =>
  useQuery({
    queryKey: ['products', page, search, isActive],
    queryFn: () => productsApi.list(page, search, isActive),
  })

export const useCreateProduct = (): UseMutationResult<
  Product,
  Error,
  ProductFormValues
> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (payload: ProductFormValues) => productsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      notify.success(PRODUCTS_LABELS.CREATED_SUCCESS)
    },
  })
}

export const useUpdateProduct = (): UseMutationResult<
  Product,
  Error,
  { id: string; payload: Partial<ProductFormValues> }
> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductFormValues> }) =>
      productsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      notify.success(PRODUCTS_LABELS.UPDATED_SUCCESS)
    },
  })
}

export const useDeleteProduct = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      notify.success(PRODUCTS_LABELS.DELETED_SUCCESS)
    },
  })
}
