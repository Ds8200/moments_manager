'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { productsApi } from '../api'
import type { Product, ProductFormValues, ProductsResponse } from '../types'

export const useProduct = (id: string | null): UseQueryResult<Product> =>
  useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.get(id!),
    enabled: id !== null,
  })

export const useProducts = (page = 1, search = ''): UseQueryResult<ProductsResponse> =>
  useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productsApi.list(page, search),
  })

export const useCreateProduct = (): UseMutationResult<
  Product,
  Error,
  ProductFormValues
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductFormValues) => productsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export const useUpdateProduct = (): UseMutationResult<
  Product,
  Error,
  { id: string; payload: Partial<ProductFormValues> }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductFormValues> }) =>
      productsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export const useDeleteProduct = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
