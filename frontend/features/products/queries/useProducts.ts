'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '../api'
import type { ProductFormValues } from '../types'

export const useProducts = (page = 1, search = '') =>
  useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productsApi.list(page, search),
  })

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductFormValues) => productsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductFormValues> }) =>
      productsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
