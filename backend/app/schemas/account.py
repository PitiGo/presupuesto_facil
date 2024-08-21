from pydantic import BaseModel
from typing import Optional

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

    class Config:
        orm_mode = True
