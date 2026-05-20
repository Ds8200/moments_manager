'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { customersApi } from '../api'
import type { CustomerFormValues } from '../types'

export const useCustomers = (page = 1, search = '', page_size = 20) =>
  useQuery({
    queryKey: ['customers', page, search, page_size],
    queryFn: () => customersApi.list(page, search, page_size),
  })

export const useCustomer = (id: string | null) =>
  useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(id!),
    enabled: id !== null,
  })

export const useCreateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CustomerFormValues) => customersApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CustomerFormValues> }) =>
      customersApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', id] })
    },
  })
}

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  })
}
