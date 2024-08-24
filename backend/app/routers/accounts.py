from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import accounts_service
from app.core.firebase import get_current_user
from app.models.account import AccountModel
from app.schemas.account import Account, AccountCreate
from app.schemas.transaction import Transaction
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
        return JSONResponse(content={"message": "Accounts and transactions synced successfully", "accounts": accounts})
    except HTTPException as e:
        logger.error(f"HTTP exception in truelayer_callback: {e.detail}")
        if e.status_code == 400 and "ya ha sido utilizado" in e.detail:
            # Si el código ya ha sido utilizado, devolvemos un 200 OK para evitar reintentos
            return JSONResponse(content={"message": e.detail}, status_code=200)
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in truelayer_callback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.get("/accounts", response_model=List[Account])
async def get_accounts(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    firebase_user = get_current_user(credentials.credentials)
    accounts = accounts_service.get_user_accounts(db, firebase_user['uid'])
    return [Account.from_orm(account) for account in accounts]


@router.get("/accounts/{account_id}/transactions", response_model=List[Transaction])
async def get_account_transactions(
    account_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    firebase_user = get_current_user(credentials.credentials)
    account = db.query(AccountModel).filter(AccountModel.account_id == account_id, AccountModel.user_id == firebase_user['uid']).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    transactions = accounts_service.get_account_transactions(db, account_id)
    return [Transaction.from_orm(transaction) for transaction in transactions]

@router.post("/accounts/{account_id}/sync-transactions", response_model=dict)
async def sync_account_transactions(
    account_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    firebase_user = get_current_user(credentials.credentials)
    account = db.query(AccountModel).filter(AccountModel.account_id == account_id, AccountModel.user_id == firebase_user['uid']).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    synced_transactions = await accounts_service.sync_account_transactions(db, firebase_user['uid'], account_id)
    return {"message": "Transactions synced successfully", "count": len(synced_transactions)}
