'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type {
  Order,
  OrdersResponse,
  OrderPayload,
  OrderFilters,
  UpdateStatusPayload,
  UpdatePaymentPayload,
  UpdateUrgencyPayload,
} from './types'

export const ordersApi = {
  list: (filters: Partial<OrderFilters>): Promise<OrdersResponse> => {
    const params = new URLSearchParams()
    if (filters.search)    params.set('search', filters.search)
    if (filters.status)    params.set('status', filters.status)
    if (filters.payment_state === 'unpaid') {
      params.set('is_paid', 'false')
    } else if (filters.payment_state === 'transfer') {
      params.set('is_paid', 'true')
      params.set('payment_method', 'transfer')
    } else if (filters.payment_state === 'cash') {
      params.set('is_paid', 'true')
      params.set('payment_method', 'cash')
    }
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to)   params.set('date_to', filters.date_to)
    if (filters.sort_by)   params.set('sort_by', filters.sort_by)
    params.set('page', String(filters.page ?? 1))
    params.set('page_size', String(filters.page_size ?? 20))
    const query = params.toString()
    return apiClient<OrdersResponse>(`${API_ENDPOINTS.ORDERS}${query ? `?${query}` : ''}`)
  },

  get: (id: string): Promise<Order> =>
    apiClient<Order>(API_ENDPOINTS.ORDER(id)),

  create: (payload: OrderPayload): Promise<Order> =>
    apiClient<Order>(API_ENDPOINTS.ORDERS, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<OrderPayload>): Promise<Order> =>
    apiClient<Order>(API_ENDPOINTS.ORDER(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> =>
    apiClient<void>(API_ENDPOINTS.ORDER(id), { method: 'DELETE' }),

  updateStatus: (id: string, payload: UpdateStatusPayload): Promise<Order> =>
    apiClient<Order>(API_ENDPOINTS.ORDER_STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updatePayment: (id: string, payload: UpdatePaymentPayload): Promise<Order> =>
    apiClient<Order>(API_ENDPOINTS.ORDER_PAYMENT(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateUrgency: (id: string, payload: UpdateUrgencyPayload): Promise<Order> =>
    apiClient<Order>(API_ENDPOINTS.ORDER_URGENCY(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  uploadFile: (orderId: string, file: File): Promise<Order> => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient<Order>(API_ENDPOINTS.ORDER_FILES(orderId), {
      method: 'POST',
      body: formData,
    })
  },

  deleteFile: (orderId: string, fileId: string): Promise<void> =>
    apiClient<void>(API_ENDPOINTS.ORDER_FILE(orderId, fileId), { method: 'DELETE' }),
}
