from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from decimal import Decimal

class CategoryBase(BaseModel):
    name: str
    type: str = "regular"
    group_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    estimated_amount: Optional[Decimal] = None
    assigned_amount: Optional[Decimal] = None
    spent_amount: Optional[Decimal] = None
    group_id: Optional[int] = None

    class Config:
        from_attributes = True