from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from ..database import Base
from sqlalchemy.orm import relationship
from datetime import datetime

class AccountModel(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.firebase_uid"))
    account_id = Column(String, unique=True, index=True)
    account_type = Column(String)
    account_name = Column(String)
    balance = Column(Float)
    currency = Column(String)
    institution_name = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    transactions = relationship("TransactionModel", back_populates="account")
