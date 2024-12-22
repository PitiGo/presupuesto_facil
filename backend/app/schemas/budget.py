from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal

class BudgetBase(BaseModel):
    category_id: int
    estimated_amount: Decimal
    period_start: date
    period_end: date

class BudgetCreate(BudgetBase):
    pass

class Budget(BudgetBase):
    id: int
    user_id: str
    assigned_amount: Decimal
    spent_amount: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True