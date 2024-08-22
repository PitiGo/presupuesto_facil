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
        from_attributes = True  # Esta es la nueva forma de configurar orm_mode en Pydantic v2
