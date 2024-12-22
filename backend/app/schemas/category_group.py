from pydantic import BaseModel
from datetime import datetime

class CategoryGroupBase(BaseModel):
    name: str

class CategoryGroupCreate(CategoryGroupBase):
    pass

class CategoryGroup(CategoryGroupBase):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True