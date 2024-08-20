

#routes/auth.py

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.schemas.user import User,UserCreate
from app.database import get_db
from app.services import auth_service
from app.core.firebase import get_current_user

# Configurar el logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=User)
async def register(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    firebase_user = get_current_user(credentials.credentials)
    user = auth_service.get_or_create_user(db, firebase_user)
    return user

@router.get("/me", response_model=User)
async def read_users_me(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        firebase_user = get_current_user(credentials.credentials)
        logger.info(f"Firebase user: {firebase_user}")
        
        user = auth_service.get_user_by_email(db, firebase_user['email'])
        
        if user is None:
            # Si el usuario no existe, lo creamos
            logger.info(f"Creating new user for email: {firebase_user['email']}")
            user_data = UserCreate(
                full_name=firebase_user.get('name', ''),
                email=firebase_user['email'],
                firebase_uid=firebase_user['uid']
            )
            user = auth_service.create_user(db, user_data)
            logger.info(f"New user created: {user}")
        else:
            logger.info(f"Existing user found: {user}")
        
        return user
    except Exception as e:
        logger.error(f"Error in /me: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
