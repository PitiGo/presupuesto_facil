#models/user.py
from sqlalchemy import Column, Integer, String
from app.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255))
    email = Column(String(255), unique=True, nullable=False, index=True)
    firebase_uid = Column(String(255), unique=True, nullable=False, index=True)
