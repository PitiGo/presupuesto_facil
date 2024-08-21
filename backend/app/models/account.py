from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database import Base

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
