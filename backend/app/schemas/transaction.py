from pydantic import BaseModel
from datetime import datetime

class TransactionBase(BaseModel):
    transaction_id: str
    amount: float
    currency: str
    description: str
    transaction_type: str
    transaction_category: str
    timestamp: datetime

class TransactionCreate(TransactionBase):
    account_id: str

class Transaction(TransactionBase):
    id: int

    class Config:
        from_attributes = True
