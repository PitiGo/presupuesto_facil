# Pydantic Schemas
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TransactionBase(BaseModel):
    account_id: str
    transaction_id: str
    amount: float
    currency: str
    description: str
    transaction_type: str
    transaction_category: str
    timestamp: datetime
    category_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    user_id: str

    class Config:
        from_attributes = True

class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    description: Optional[str] = None
    transaction_type: Optional[str] = None
    transaction_category: Optional[str] = None