from decimal import Decimal

from pydantic import BaseModel


class DashboardKpiSchema(BaseModel):
    open_orders: int
    ready_orders: int
    monthly_revenue: Decimal
    monthly_expenses: Decimal
    monthly_profit: Decimal
    unpaid_amount: Decimal
    today_orders: int


class MonthlyReportSchema(BaseModel):
    year: int
    month: int
    total_revenue: Decimal
    total_cost: Decimal
    total_profit: Decimal
    total_expenses: Decimal
    net_profit: Decimal
    paid_count: int
    unpaid_count: int
    total_count: int
    collection_rate: float
    cash_revenue: Decimal
    transfer_revenue: Decimal
    unpaid_amount: Decimal
    paid_revenue: Decimal


class FinancialYearSchema(BaseModel):
    year: int
    months: list[MonthlyReportSchema]
    annual_revenue: Decimal
    annual_profit: Decimal
    annual_expenses: Decimal
    annual_cost: Decimal
    annual_net: Decimal
    annual_unpaid: Decimal


class TopCustomerSchema(BaseModel):
    customer_id: str
    customer_name: str
    order_count: int
    total_revenue: Decimal
    total_profit: Decimal
