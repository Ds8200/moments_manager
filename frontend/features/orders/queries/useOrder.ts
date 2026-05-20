'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '../api'
import type { OrderFormValues } from '../types'

export const useOrder = (id: string | null) =>
  useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id!),
    enabled: id !== null,
  })

export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: OrderFormValues) => ordersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useUpdateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<OrderFormValues> }) =>
      ordersApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', id] })
    },
  })
}
