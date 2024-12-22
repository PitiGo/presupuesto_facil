from pydantic import BaseModel
from datetime import datetime

class AccountBase(BaseModel):
    account_id: str
    account_type: str
    account_name: str
    balance: float
    currency: str
    institution_name: str

class AccountCreate(AccountBase):
    user_id: str

class Account(AccountBase):
    id: int
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True