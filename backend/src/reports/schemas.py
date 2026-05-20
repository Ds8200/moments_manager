from decimal import Decimal
from pydantic import BaseModel


class DashboardKpiSchema(BaseModel):
    open_orders: int
    ready_orders: int
    monthly_revenue: Decimal
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
    cash_revenue: Decimal
    transfer_revenue: Decimal
    order_count: int


class FinancialYearSchema(BaseModel):
    year: int
    months: list[MonthlyReportSchema]
    annual_revenue: Decimal
    annual_profit: Decimal
    annual_expenses: Decimal
    annual_net: Decimal


class TopCustomerSchema(BaseModel):
    customer_id: str
    customer_name: str
    order_count: int
    total_revenue: Decimal
    total_profit: Decimal
