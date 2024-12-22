from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255))
    email = Column(String(255), unique=True, nullable=False, index=True)
    firebase_uid = Column(String(255), unique=True, nullable=False, index=True)

    ready_to_assign = relationship("ReadyToAssign", back_populates="user", uselist=False)