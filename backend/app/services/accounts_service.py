from sqlalchemy.orm import Session
from app.models.account import AccountModel
from app.schemas.account import AccountCreate, Account
from fastapi import HTTPException
import httpx
from datetime import datetime, timedelta
import logging
from typing import List

# Configuraciones de Truelayer
TRUELAYER_CLIENT_ID = "sandbox-dividendtree-757325"
TRUELAYER_CLIENT_SECRET = "4233fb01-03d3-41c2-a171-c0e1257f10ad"
TRUELAYER_REDIRECT_URI = "http://localhost:3000/truelayer-callback"
TRUELAYER_AUTH_URL = "https://auth.truelayer-sandbox.com"
TRUELAYER_API_URL = "https://api.truelayer-sandbox.com"

logger = logging.getLogger(__name__)

class TokenManager:
    def __init__(self):
        self.tokens = {}

    def store_tokens(self, user_id: str, access_token: str, refresh_token: str | None, expires_in: int):
        expiry = datetime.now() + timedelta(seconds=expires_in)
        self.tokens[user_id] = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expiry": expiry
        }

    async def get_valid_access_token(self, user_id: str):
        if user_id in self.tokens:
            token_info = self.tokens[user_id]
            if datetime.now() < token_info["expiry"]:
                return token_info["access_token"]
            else:
                # Token expirado, intentar refresh
                new_tokens = await self.refresh_token(user_id)
                if new_tokens:
                    self.store_tokens(user_id, new_tokens["access_token"], new_tokens["refresh_token"], new_tokens["expires_in"])
                    return new_tokens["access_token"]
        return None

    async def refresh_token(self, user_id: str):
        refresh_token = self.tokens[user_id]["refresh_token"]
        payload = {
            'grant_type': 'refresh_token',
            'client_id': TRUELAYER_CLIENT_ID,
            'client_secret': TRUELAYER_CLIENT_SECRET,
            'refresh_token': refresh_token
        }
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(f"{TRUELAYER_AUTH_URL}/connect/token", data=payload, headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Error refreshing token: {e}")
                return None

token_manager = TokenManager()

def get_truelayer_auth_url() -> str:
    scopes = "info accounts balance transactions cards"
    providers = "uk-cs-mock"
    url = (f"{TRUELAYER_AUTH_URL}/?response_type=code&client_id={TRUELAYER_CLIENT_ID}"
           f"&redirect_uri={TRUELAYER_REDIRECT_URI}&scope={scopes}&providers={providers}")
    return url

async def exchange_truelayer_code(code: str, user_id: str):
    if not code:
        raise HTTPException(status_code=422, detail="Authorization code is required")

    payload = {
        'grant_type': 'authorization_code',
        'client_id': TRUELAYER_CLIENT_ID,
        'client_secret': TRUELAYER_CLIENT_SECRET,
        'redirect_uri': TRUELAYER_REDIRECT_URI,
        'code': code
    }

    headers = {'Content-Type': 'application/x-www-form-urlencoded'}

    logger.info(f"Exchanging code for token. Payload: {payload}")
    logger.info(f"Truelayer Auth URL: {TRUELAYER_AUTH_URL}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{TRUELAYER_AUTH_URL}/connect/token", data=payload, headers=headers)
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error occurred: {e}")
        logger.error(f"Response content: {e.response.text}")
        if e.response.status_code == 400 and "invalid_grant" in e.response.text:
            raise HTTPException(
                status_code=400,
                detail="El código de autorización ha expirado o ya ha sido utilizado. Por favor, intente conectar su cuenta nuevamente."
            )
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

    if response.status_code == 200:
        tokens = response.json()
        logger.info(f"Token exchange successful for user {user_id}")
        token_manager.store_tokens(user_id, tokens["access_token"], tokens.get("refresh_token"), tokens["expires_in"])
        return tokens
    else:
        logger.error(f"Token exchange failed. Status: {response.status_code}, Response: {response.text}")
        raise HTTPException(status_code=response.status_code, detail=f"Failed to get tokens from TrueLayer: {response.text}")

async def get_truelayer_accounts(user_id: str):
    access_token = await token_manager.get_valid_access_token(user_id)
    if not access_token:
        raise HTTPException(status_code=401, detail="No valid access token found")

    headers = {'Authorization': f"Bearer {access_token}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{TRUELAYER_API_URL}/data/v1/accounts", headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        logger.error(f"Failed to fetch accounts. Status: {response.status_code}, Response: {response.text}")
        raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch accounts from TrueLayer: {response.text}")

async def get_truelayer_balance(user_id: str, account_id: str):
    access_token = await token_manager.get_valid_access_token(user_id)
    if not access_token:
        raise HTTPException(status_code=401, detail="No valid access token found")

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{TRUELAYER_API_URL}/data/v1/accounts/{account_id}/balance", headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        logger.error(f"Failed to fetch balance. Status: {response.status_code}, Response: {response.text}")
        raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch balance from TrueLayer: {response.text}")

async def process_truelayer_callback(code: str, user_id: str, db: Session):
    try:
        tokens = await exchange_truelayer_code(code, user_id)
        accounts_data = await get_truelayer_accounts(user_id)
        
        processed_accounts = []
        for account in accounts_data.get('results', []):
            balance_data = await get_truelayer_balance(user_id, account['account_id'])
            current_balance = balance_data['results'][0]['current'] if balance_data.get('results') else None
            
            account_data = AccountCreate(
                user_id=user_id,
                account_id=account['account_id'],
                account_type=account['account_type'],
                account_name=account.get('display_name', 'Unknown Account'),
                balance=current_balance,
                currency=account['currency'],
                institution_name=account.get('provider', {}).get('display_name', 'Unknown Institution')
            )
            
            db_account = create_or_update_account(db, account_data)
            processed_accounts.append(db_account)
        
        return processed_accounts
    except HTTPException as e:
        logger.error(f"HTTP exception in process_truelayer_callback: {e.detail}")
        if e.status_code == 401:
            # Token expirado o inválido
            raise HTTPException(status_code=401, detail="Token expirado. Por favor, vuelva a conectar su cuenta.")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in process_truelayer_callback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

def get_user_accounts(db: Session, user_id: str) -> List[Account]:
    db_accounts = db.query(AccountModel).filter(AccountModel.user_id == user_id).all()
    return [Account.from_orm(account) for account in db_accounts]

def create_or_update_account(db: Session, account: AccountCreate) -> AccountModel:
    # Buscar si la cuenta ya existe
    existing_account = db.query(AccountModel).filter(AccountModel.account_id == account.account_id).first()
    
    if existing_account:
        # Actualizar la cuenta existente
        for key, value in account.dict().items():
            setattr(existing_account, key, value)
    else:
        # Crear una nueva cuenta
        existing_account = AccountModel(**account.dict())
        db.add(existing_account)
    
    db.commit()
    db.refresh(existing_account)
    return existing_account
