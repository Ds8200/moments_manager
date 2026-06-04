'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { ordersApi } from '../api'
import { useNotify } from '@/shared/hooks/useNotify'
import { ORDERS_LABELS } from '../constants/ordersLabels'
import type { Order, OrderPayload } from '../types'

export const useOrder = (id: string | null): UseQueryResult<Order> =>
  useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id!),
    enabled: id !== null,
  })

export const useCreateOrder = (): UseMutationResult<Order, Error, OrderPayload> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (payload: OrderPayload) => ordersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      notify.success(ORDERS_LABELS.CREATED_SUCCESS)
    },
  })
}

export const useUpdateOrder = (): UseMutationResult<
  Order,
  Error,
  { id: string; payload: Partial<OrderPayload> }
> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<OrderPayload> }) =>
      ordersApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      notify.success(ORDERS_LABELS.UPDATED_SUCCESS)
    },
  })
}
