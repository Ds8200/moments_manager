'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { Customer, CustomerDetail, CustomersResponse, CustomerFormValues, CustomerSendEmailPayload, EmailSentResponse } from './types'

export const customersApi = {
  list: (page = 1, search = '', page_size = 20, has_email?: boolean): Promise<CustomersResponse> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(page_size) })
    if (search) params.set('search', search)
    if (has_email) params.set('has_email', 'true')
    return apiClient<CustomersResponse>(`${API_ENDPOINTS.CUSTOMERS}?${params}`)
  },

  get: (id: string): Promise<CustomerDetail> =>
    apiClient<CustomerDetail>(API_ENDPOINTS.CUSTOMER(id)),

  create: (payload: CustomerFormValues): Promise<Customer> =>
    apiClient<Customer>(API_ENDPOINTS.CUSTOMERS, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<CustomerFormValues>): Promise<Customer> =>
    apiClient<Customer>(API_ENDPOINTS.CUSTOMER(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> =>
    apiClient<void>(API_ENDPOINTS.CUSTOMER(id), { method: 'DELETE' }),

  sendEmail: (id: string, payload: CustomerSendEmailPayload): Promise<EmailSentResponse> =>
    apiClient<EmailSentResponse>(API_ENDPOINTS.CUSTOMER_SEND_EMAIL(id), {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
