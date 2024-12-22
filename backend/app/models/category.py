from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, default="regular")
    group_id = Column(Integer, ForeignKey("category_groups.id"))
    user_id = Column(String, ForeignKey("users.firebase_uid"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    group = relationship("CategoryGroup", back_populates="categories")
    budgets = relationship("Budget", back_populates="category")
    transactions = relationship("TransactionModel", back_populates="category")