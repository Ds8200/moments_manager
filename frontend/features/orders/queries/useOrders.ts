'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { ordersApi } from '../api'
import { orderFiltersAtom } from '../store/ordersAtoms'
import type {
  Order,
  OrdersResponse,
  UpdatePaymentPayload,
  UpdateStatusPayload,
  UpdateUrgencyPayload,
} from '../types'

export const useOrders = (): UseQueryResult<OrdersResponse> => {
  const filters = useAtomValue(orderFiltersAtom)
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.list(filters),
  })
}

export const useUpdateOrderStatus = (): UseMutationResult<
  Order,
  Error,
  { id: string; payload: UpdateStatusPayload }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStatusPayload }) =>
      ordersApi.updateStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export const useUpdateOrderPayment = (): UseMutationResult<
  Order,
  Error,
  { id: string; payload: UpdatePaymentPayload }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePaymentPayload }) =>
      ordersApi.updatePayment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export const useUpdateOrderUrgency = (): UseMutationResult<
  Order,
  Error,
  { id: string; payload: UpdateUrgencyPayload }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUrgencyPayload }) =>
      ordersApi.updateUrgency(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export const useDeleteOrder = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
