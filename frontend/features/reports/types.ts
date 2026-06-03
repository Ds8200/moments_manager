export interface MonthlyReport {
  year: number
  month: number
  total_revenue: string
  total_cost: string
  total_profit: string
  total_expenses: string
  net_profit: string
  cash_revenue: string
  transfer_revenue: string
  paid_revenue: string
  order_count: number
}

export interface FinancialReport {
  year: number
  months: MonthlyReport[]
  annual_revenue: string
  annual_profit: string
  annual_expenses: string
  annual_net: string
}

export interface TopCustomer {
  customer_id: string
  customer_name: string
  order_count: number
  total_revenue: string
  total_profit: string
}
