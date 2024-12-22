from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..services import accounts_service
from ..core.firebase import get_current_user
from ..models.account import AccountModel
from ..schemas.account import Account, AccountCreate
from ..schemas.transaction import Transaction
from typing import List
from fastapi.responses import JSONResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/connect-truelayer", response_model=dict)
async def connect_truelayer(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    auth_url = accounts_service.get_truelayer_auth_url(current_user['uid'])
    return {"auth_url": auth_url}

@router.get("/callback")
async def truelayer_callback(code: str, state: str, db: Session = Depends(get_db)):
    try:
        logger.info(f"Recibido callback de Truelayer. Code: {code}, State: {state}")
        
        user_id, _ = state.split(':', 1)
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        logger.info(f"Procesando callback para user_id: {user_id}")
        
        accounts = await accounts_service.process_truelayer_callback(code, user_id, db)
        logger.info(f"Proceso de callback completado. Cuentas procesadas: {len(accounts)}")
        
        return {"message": "Accounts and transactions synced successfully", "accounts": [Account.from_orm(account) for account in accounts]}
    except HTTPException as e:
        if e.status_code == 400 and "ya ha sido utilizado" in e.detail:
            logger.warning(f"Código de autorización ya utilizado: {e.detail}")
            return JSONResponse(content={"message": e.detail}, status_code=200)
        logger.error(f"HTTP exception in truelayer_callback: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in truelayer_callback: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.get("/accounts", response_model=List[Account])
async def get_accounts(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        logger.info(f"Fetching accounts for user: {current_user['uid']}")
        accounts = accounts_service.get_user_accounts_from_db(db, current_user['uid'])
        logger.info(f"Found {len(accounts)} accounts for user: {current_user['uid']}")
        return accounts
    except Exception as e:
        logger.error(f"Unexpected error in get_accounts: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while fetching accounts")

@router.get("/accounts/{account_id}/transactions", response_model=List[Transaction])
async def get_account_transactions(
    account_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(AccountModel).filter(AccountModel.account_id == account_id, AccountModel.user_id == current_user['uid']).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    transactions = accounts_service.get_account_transactions_from_db(db, account_id)
    return transactions

@router.post("/accounts/sync", response_model=List[Account])
async def sync_accounts(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Syncing accounts for user: {current_user['uid']}")
        synced_accounts = await accounts_service.sync_user_accounts(current_user['uid'], db)
        logger.info(f"Synced {len(synced_accounts)} accounts for user: {current_user['uid']}")
        return synced_accounts
    except Exception as e:
        logger.error(f"Error syncing accounts: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while syncing accounts")

@router.post("/accounts/{account_id}/sync-transactions", response_model=dict)
async def sync_account_transactions(
    account_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(AccountModel).filter(AccountModel.account_id == account_id, AccountModel.user_id == current_user['uid']).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    synced_transactions = await accounts_service.sync_account_transactions(db, current_user['uid'], account_id)
    return {"message": "Transactions synced successfully", "count": len(synced_transactions)}