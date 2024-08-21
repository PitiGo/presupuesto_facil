from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import accounts_service
from app.core.firebase import get_current_user
from app.schemas.account import Account, AccountCreate
from typing import List

router = APIRouter()
security = HTTPBearer()

@router.post("/connect-truelayer", response_model=dict)
async def connect_truelayer(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    firebase_user = get_current_user(credentials.credentials)
    auth_url = accounts_service.get_truelayer_auth_url(firebase_user['uid'])
    return {"auth_url": auth_url}

@router.get("/callback", response_model=dict)
async def truelayer_callback(code: str, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    firebase_user = get_current_user(credentials.credentials)
    accounts = accounts_service.process_truelayer_callback(code, firebase_user['uid'], db)
    return {"message": "Accounts synced successfully", "accounts": accounts}

@router.get("/accounts", response_model=List[Account])
async def get_accounts(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    firebase_user = get_current_user(credentials.credentials)
    accounts = accounts_service.get_user_accounts(db, firebase_user['uid'])
    return accounts
