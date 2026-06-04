'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { customersApi } from '../api'
import { useNotify } from '@/shared/hooks/useNotify'
import { CUSTOMERS_LABELS } from '../constants/customersLabels'
import type {
  Customer,
  CustomerDetail,
  CustomerFormValues,
  CustomerSendEmailPayload,
  CustomersResponse,
  EmailSentResponse,
} from '../types'

export const useCustomers = (
  page = 1,
  search = '',
  page_size = 20,
): UseQueryResult<CustomersResponse> =>
  useQuery({
    queryKey: ['customers', page, search, page_size],
    queryFn: () => customersApi.list(page, search, page_size),
  })

export const useAllCustomersWithEmail = (): UseQueryResult<CustomersResponse> =>
  useQuery({
    queryKey: ['customers', 'all-with-email'],
    queryFn: () => customersApi.list(1, '', 100, true),
  })

export const useCustomer = (id: string | null): UseQueryResult<CustomerDetail> =>
  useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(id!),
    enabled: id !== null,
  })

export const useCreateCustomer = (): UseMutationResult<
  Customer,
  Error,
  CustomerFormValues
> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (payload: CustomerFormValues) => customersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      notify.success(CUSTOMERS_LABELS.CREATED_SUCCESS)
    },
  })
}

export const useUpdateCustomer = (): UseMutationResult<
  Customer,
  Error,
  { id: string; payload: Partial<CustomerFormValues> }
> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CustomerFormValues> }) =>
      customersApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', id] })
      notify.success(CUSTOMERS_LABELS.UPDATED_SUCCESS)
    },
  })
}

export const useDeleteCustomer = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      notify.success(CUSTOMERS_LABELS.DELETED_SUCCESS)
    },
  })
}

export const useSendCustomerEmail = (): UseMutationResult<
  EmailSentResponse,
  Error,
  { id: string; payload: CustomerSendEmailPayload }
> => {
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerSendEmailPayload }) =>
      customersApi.sendEmail(id, payload),
    onSuccess: () => notify.success(CUSTOMERS_LABELS.EMAIL_SENT_SUCCESS),
    onError: () => notify.error(CUSTOMERS_LABELS.EMAIL_SEND_ERROR),
  })
}
