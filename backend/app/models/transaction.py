# SQLAlchemy Model
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.account_id"))
    user_id = Column(String, ForeignKey("users.firebase_uid"), nullable=False)
    transaction_id = Column(String, unique=True, index=True)
    amount = Column(Float)
    currency = Column(String)
    description = Column(String)
    transaction_type = Column(String)
    transaction_category = Column(String)
    timestamp = Column(DateTime)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    account = relationship("AccountModel", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")