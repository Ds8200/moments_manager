import type { OrderStatus, PaymentMethod } from '@/shared/enums/statusEnums'

export type OrderUrgency = 'critical' | 'high' | 'medium' | 'low'

export interface OrderFile {
  id: string
  original_name: string
  storage_path: string
  file_type: 'image' | 'pdf' | 'other'
  file_size_bytes: number
  created_at: string
}

export interface OrderItem {
  id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: string
  unit_cost: string
  total_price: string
  profit: string
  design_notes: string | null
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  customer_name: string
  date: string
  due_datetime: string | null
  urgency: OrderUrgency | null
  status: OrderStatus
  is_paid: boolean
  payment_method: PaymentMethod | null
  total_amount: string
  total_cost: string
  total_profit: string
  notes: string | null
  items: OrderItem[]
  files: OrderFile[]
  created_at: string
  updated_at: string
}

export interface OrderSummary {
  id: string
  order_number: string
  customer_id: string
  customer_name: string
  date: string
  due_datetime: string | null
  urgency: OrderUrgency | null
  status: OrderStatus
  is_paid: boolean
  payment_method: PaymentMethod | null
  total_amount: string
  total_profit: string
  created_at: string
}

export interface OrderFilters {
  search: string
  status: OrderStatus | ''
  is_paid: '' | 'true' | 'false'
  date_from: string
  date_to: string
  page: number
  page_size: number
}

export interface OrdersResponse {
  items: OrderSummary[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface OrderItemFormValues {
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: string
  unit_cost: string
  design_notes: string
}

export interface OrderFormValues {
  customer_id:   string
  customer_name: string
  date:          string
  due_datetime:  string
  notes:         string
  items:         OrderItemFormValues[]
}

export type OrderPayload = Omit<OrderFormValues, 'due_datetime' | 'customer_id' | 'customer_name'> & {
  customer_id:  string | null
  due_datetime: string | null
}

export interface UpdateStatusPayload {
  status: OrderStatus
}

export interface UpdatePaymentPayload {
  is_paid: boolean
  payment_method: PaymentMethod | null
}
