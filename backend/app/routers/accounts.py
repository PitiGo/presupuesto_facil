from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import accounts_service
from app.core.firebase import get_current_user
from app.schemas.account import Account, AccountCreate
from typing import List
import logging
router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger(__name__)
@router.post("/connect-truelayer", response_model=dict)
async def connect_truelayer(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    firebase_user = get_current_user(credentials.credentials)
    auth_url = accounts_service.get_truelayer_auth_url()
    return {"auth_url": auth_url}


@router.get("/callback", response_model=dict)
async def truelayer_callback(code: str, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        firebase_user = get_current_user(credentials.credentials)
        accounts = await accounts_service.process_truelayer_callback(code, firebase_user['uid'], db)
        # Convertir los modelos SQLAlchemy a esquemas Pydantic
        pydantic_accounts = [Account.from_orm(account) for account in accounts]
        return {"message": "Accounts synced successfully", "accounts": pydantic_accounts}
    except HTTPException as e:
        logger.error(f"HTTP exception in truelayer_callback: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in truelayer_callback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.get("/accounts", response_model=List[Account])
async def get_accounts(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    firebase_user = get_current_user(credentials.credentials)
    accounts = accounts_service.get_user_accounts(db, firebase_user['uid'])
    return [Account.from_orm(account) for account in accounts]
