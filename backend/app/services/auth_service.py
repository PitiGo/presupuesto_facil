from sqlalchemy.orm import Session
from app.models.user import UserModel
from app.schemas.user import UserCreate
from app.core.firebase import get_current_user

def get_user_by_email(db: Session, email: str):
    return db.query(UserModel).filter(UserModel.email == email).first()

def create_user(db: Session, user_data: UserCreate):
    db_user = UserModel(
        full_name=user_data.full_name,
        email=user_data.email,
        firebase_uid=user_data.firebase_uid
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_or_create_user(db: Session, firebase_user: dict):
    user = get_user_by_email(db, firebase_user['email'])
    if not user:
        user = UserModel(
            email=firebase_user['email'],
            firebase_uid=firebase_user['uid']
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
