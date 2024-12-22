from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Date
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.firebase_uid"), nullable=False)
    estimated_amount = Column(Numeric(10, 2), nullable=False)
    assigned_amount = Column(Numeric(10, 2), default=0)
    spent_amount = Column(Numeric(10, 2), default=0)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="budgets")