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
import { useNotify } from '@/shared/hooks/useNotify'
import { ORDERS_LABELS } from '../constants/ordersLabels'
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
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export const useUpdateOrderStatus = (): UseMutationResult<
  Order,
  Error,
  { id: string; payload: UpdateStatusPayload }
> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStatusPayload }) =>
      ordersApi.updateStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      notify.success(ORDERS_LABELS.UPDATED_SUCCESS)
    },
  })
}

export const useUpdateOrderPayment = (): UseMutationResult<
  Order,
  Error,
  { id: string; payload: UpdatePaymentPayload }
> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePaymentPayload }) =>
      ordersApi.updatePayment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      notify.success(ORDERS_LABELS.UPDATED_SUCCESS)
    },
  })
}

export const useUpdateOrderUrgency = (): UseMutationResult<
  Order,
  Error,
  { id: string; payload: UpdateUrgencyPayload }
> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUrgencyPayload }) =>
      ordersApi.updateUrgency(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
      notify.success(ORDERS_LABELS.UPDATED_SUCCESS)
    },
  })
}

export const useDeleteOrder = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      notify.success(ORDERS_LABELS.DELETED_SUCCESS)
    },
  })
}
