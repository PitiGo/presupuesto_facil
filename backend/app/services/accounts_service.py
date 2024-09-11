import pytz
import secrets

from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from ..models.account import AccountModel
from ..models.transaction import TransactionModel
from ..schemas.transaction import TransactionCreate
from ..models.transaction import TransactionModel
from ..schemas.account import AccountCreate, Account
from fastapi import HTTPException
import httpx
from datetime import datetime, timedelta
import logging
from typing import List
import asyncio
from sqlalchemy.exc import SQLAlchemyError
from ..schemas.account import AccountCreate, Account
from ..schemas.transaction import Transaction

# TrueLayer configurations
TRUELAYER_CLIENT_ID = "sandbox-dividendtree-757325"
TRUELAYER_CLIENT_SECRET = "51d894c8-a3ea-4288-b581-e07c27709487"
TRUELAYER_REDIRECT_URI = "http://localhost:3000/truelayer-callback"
TRUELAYER_AUTH_URL = "https://auth.truelayer-sandbox.com"
TRUELAYER_API_URL = "https://api.truelayer-sandbox.com"

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
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
        logger.info(f"Attempting to get valid access token for user_id: {user_id}")
        if user_id in self.tokens:
            token_info = self.tokens[user_id]
            if datetime.now() < token_info["expiry"]:
                logger.info(f"Valid access token found for user_id: {user_id}")
                return token_info["access_token"]
            else:
                logger.info(f"Access token expired for user_id: {user_id}. Attempting to refresh.")
                new_tokens = await self.refresh_token(user_id)
                if new_tokens:
                    logger.info(f"Successfully refreshed token for user_id: {user_id}")
                    self.store_tokens(user_id, new_tokens["access_token"], new_tokens["refresh_token"], new_tokens["expires_in"])
                    return new_tokens["access_token"]
                else:
                    logger.error(f"Failed to refresh token for user_id: {user_id}")
        else:
            logger.error(f"No token information found for user_id: {user_id}")
        return None

    async def refresh_token(self, user_id: str):
        logger.info(f"Attempting to refresh token for user_id: {user_id}")
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

def get_truelayer_auth_url(user_id: str) -> str:
    scopes = "info accounts balance transactions cards"
    providers = "uk-cs-mock"
    state = f"{user_id}:{secrets.token_urlsafe(16)}"
    url = (f"{TRUELAYER_AUTH_URL}/?response_type=code&client_id={TRUELAYER_CLIENT_ID}"
           f"&redirect_uri={TRUELAYER_REDIRECT_URI}&scope={scopes}&providers={providers}&state={state}")
    return url

used_auth_codes = set()
code_lock = asyncio.Lock()

async def exchange_truelayer_code(code: str, user_id: str):
    if not code:
        logger.error("Attempt to exchange code without providing a code")
        raise HTTPException(status_code=422, detail="Authorization code is required")

    async with code_lock:
        if code in used_auth_codes:
            logger.warning(f"Attempt to reuse authorization code: {code}")
            raise HTTPException(status_code=400, detail="Authorization code has already been used.")
        used_auth_codes.add(code)

    payload = {
        'grant_type': 'authorization_code',
        'client_id': TRUELAYER_CLIENT_ID,
        'client_secret': TRUELAYER_CLIENT_SECRET,
        'redirect_uri': TRUELAYER_REDIRECT_URI,
        'code': code
    }

    headers = {'Content-Type': 'application/x-www-form-urlencoded'}

    logger.info(f"Initiating code exchange for user_id: {user_id}")
    logger.debug(f"Payload for code exchange: {payload}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{TRUELAYER_AUTH_URL}/connect/token", data=payload, headers=headers)
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error during code exchange: {e}")
        logger.error(f"Response content: {e.response.text}")
        if e.response.status_code == 400 and "invalid_grant" in e.response.text:
            used_auth_codes.remove(code)
            raise HTTPException(
                status_code=400,
                detail="The authorization code has expired or has already been used. Please try connecting your account again."
            )
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except httpx.RequestError as e:
        logger.error(f"Network error during code exchange: {e}")
        used_auth_codes.remove(code)
        raise HTTPException(status_code=500, detail=f"Network error when connecting to TrueLayer: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during code exchange: {e}")
        used_auth_codes.remove(code)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    if response.status_code == 200:
        tokens = response.json()
        token_manager.store_tokens(
            user_id,
            tokens['access_token'],
            tokens.get('refresh_token'),
            tokens['expires_in']
        )
        logger.info(f"Tokens stored successfully for user_id: {user_id}")
        return tokens
    else:
        logger.error(f"Failed to exchange code. Status: {response.status_code}, Response: {response.text}")
        raise HTTPException(status_code=response.status_code, detail=f"Failed to get tokens from TrueLayer: {response.text}")

# Añadir estas nuevas funciones al principio del archivo

def get_user_accounts_from_db(db: Session, user_id: str) -> List[Account]:
    try:
        logger.info(f"Obteniendo cuentas de la base de datos para user_id: {user_id}")
        db_accounts = db.query(AccountModel).filter(AccountModel.user_id == user_id).all()
        logger.info(f"Se encontraron {len(db_accounts)} cuentas para user_id: {user_id}")
        return [Account.from_orm(account) for account in db_accounts]
    except Exception as e:
        logger.error(f"Error al obtener cuentas de la base de datos para user_id {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al obtener las cuentas")

def get_account_transactions_from_db(db: Session, account_id: str) -> List[Transaction]:
    try:
        logger.info(f"Obteniendo transacciones de la base de datos para account_id: {account_id}")
        db_transactions = db.query(TransactionModel).filter(TransactionModel.account_id == account_id).all()
        logger.info(f"Se encontraron {len(db_transactions)} transacciones para account_id: {account_id}")
        return [Transaction.model_validate(transaction.__dict__) for transaction in db_transactions]
    except Exception as e:
        logger.error(f"Error al obtener transacciones de la base de datos para account_id {account_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al obtener las transacciones")


async def get_truelayer_accounts(user_id: str):
    try:
        logger.info(f"Getting TrueLayer accounts for user_id: {user_id}")
        access_token = await token_manager.get_valid_access_token(user_id)
        if not access_token:
            logger.error(f"No valid access token found for user_id: {user_id}")
            raise HTTPException(status_code=401, detail="No valid access token found")

        headers = {'Authorization': f"Bearer {access_token}"}
        logger.debug(f"Making GET request to {TRUELAYER_API_URL}/data/v1/accounts")

        async with httpx.AsyncClient() as client:
            response = await client.get(f"{TRUELAYER_API_URL}/data/v1/accounts", headers=headers)

        response.raise_for_status()

        accounts_data = response.json()
        logger.info(f"Accounts obtained successfully for user_id: {user_id}. Number of accounts: {len(accounts_data.get('results', []))}")
        return accounts_data

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error when getting accounts for user_id: {user_id}. Status: {e.response.status_code}, Response: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Failed to fetch accounts from TrueLayer: {e.response.text}")

    except httpx.RequestError as e:
        logger.error(f"Network error when getting accounts for user_id: {user_id}. Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Network error occurred while fetching accounts: {str(e)}")

    except Exception as e:
        logger.error(f"Unexpected error when getting accounts for user_id: {user_id}. Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

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

async def sync_user_accounts(user_id: str, db: Session):
    try:
        logger.info(f"Iniciando sincronización de cuentas para user_id: {user_id}")
        accounts_data = await get_truelayer_accounts(user_id)
        
        synced_accounts = []
        for account in accounts_data.get('results', []):
            balance_data = await get_truelayer_balance(user_id, account['account_id'])
            current_balance = balance_data['results'][0]['current'] if balance_data.get('results') else -1
            
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
            synced_accounts.append(db_account)
        
        logger.info(f"Sincronización completada para user_id: {user_id}. Cuentas sincronizadas: {len(synced_accounts)}")
        return synced_accounts
    except Exception as e:
        logger.error(f"Error en sync_user_accounts: {e}", exc_info=True)
        raise

async def process_truelayer_callback(code: str, user_id: str, db: Session):
    try:
        logger.info(f"Starting process_truelayer_callback for user_id: {user_id}")
        tokens = await exchange_truelayer_code(code, user_id)
        logger.info(f"Tokens obtained for user_id: {user_id}")
        
        accounts_data = await get_truelayer_accounts(user_id)
        logger.info(f"Account data obtained for user_id: {user_id}. Number of accounts: {len(accounts_data.get('results', []))}")
        
        processed_accounts = []
        for account in accounts_data.get('results', []):
            logger.info(f"Processing account: {account['account_id']} for user_id: {user_id}")
            balance_data = await get_truelayer_balance(user_id, account['account_id'])
            current_balance = balance_data['results'][0]['current'] if balance_data.get('results') else -1
            
            account_data = AccountCreate(
                user_id=user_id,
                account_id=account['account_id'],
                account_type=account['account_type'],
                account_name=account.get('display_name', 'Unknown Account'),
                balance=current_balance,
                currency=account['currency'],
                institution_name=account.get('provider', {}).get('display_name', 'Unknown Institution')
            )
            
            logger.info(f"Creating/updating account in database: {account_data.account_id}")
            db_account = create_or_update_account(db, account_data)
            logger.info(f"Account created/updated: {db_account.account_id}")
            processed_accounts.append(db_account)
        
        logger.info(f"process_truelayer_callback completed for user_id: {user_id}. Accounts processed: {len(processed_accounts)}")
        return processed_accounts
    except Exception as e:
        logger.error(f"Error in process_truelayer_callback: {e}", exc_info=True)
        raise

def get_user_accounts(db: Session, user_id: str) -> List[Account]:
    try:
        logger.info(f"Getting accounts for user_id: {user_id}")
        db_accounts = db.query(AccountModel).filter(AccountModel.user_id == user_id).all()
        logger.info(f"Found {len(db_accounts)} accounts for user_id: {user_id}")
        return [Account.from_orm(account) for account in db_accounts]
    except Exception as e:
        logger.error(f"Error getting accounts for user_id {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal error when getting accounts")

def create_or_update_account(db: Session, account: AccountCreate) -> AccountModel:
    logger.info(f"Starting create_or_update_account for account_id: {account.account_id}")
    try:
        existing_account = db.query(AccountModel).filter(AccountModel.account_id == account.account_id).first()
        logger.info(f"Existing account found: {existing_account is not None}")
        
        if existing_account:
            logger.info(f"Updating existing account: {account.account_id}")
            for key, value in account.dict().items():
                if key != 'created_at':
                    setattr(existing_account, key, value)
        else:
            logger.info(f"Creating new account: {account.account_id}")
            existing_account = AccountModel(**account.dict(exclude={'created_at'}))
            db.add(existing_account)
        
        logger.info("Performing commit")
        db.commit()
        db.refresh(existing_account)
        logger.info(f"Account created/updated successfully: {existing_account.account_id}")
        return existing_account
    except Exception as e:
        logger.error(f"Error creating/updating account: {e}")
        db.rollback()
        raise

async def get_truelayer_transactions(user_id: str, account_id: str, db: Session):
    access_token = await token_manager.get_valid_access_token(user_id)
    if not access_token:
        raise HTTPException(status_code=401, detail="No valid access token found")

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }

    today = datetime.now(pytz.UTC)
    from_date = today - timedelta(days=30)
    
    account = db.query(AccountModel).filter(AccountModel.account_id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    from_date = max(from_date, account.created_at.replace(tzinfo=pytz.UTC))
    to_date = today

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TRUELAYER_API_URL}/data/v1/accounts/{account_id}/transactions",
            headers=headers,
            params={"from": from_date.strftime("%Y-%m-%d"), "to": to_date.strftime("%Y-%m-%d")}
        )

    if response.status_code == 200:
        return response.json()
    else:
        logger.error(f"Failed to fetch transactions. Status: {response.status_code}, Response: {response.text}")
        raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch transactions from TrueLayer: {response.text}")

def create_or_update_transaction(db: Session, transaction: TransactionCreate) -> TransactionModel:
    try:
        existing_transaction = db.query(TransactionModel).filter(TransactionModel.transaction_id == transaction.transaction_id).first()
        
        if existing_transaction:
            logger.info(f"Updating existing transaction: {transaction.transaction_id}")
            for key, value in transaction.dict().items():
                setattr(existing_transaction, key, value)
        else:
            logger.info(f"Creating new transaction: {transaction.transaction_id}")
            existing_transaction = TransactionModel(**transaction.dict())
            db.add(existing_transaction)
        
        db.commit()
        db.refresh(existing_transaction)
        logger.info(f"Transaction created/updated successfully: {existing_transaction.transaction_id}")
        return existing_transaction
    except Exception as e:
        logger.error(f"Error creating/updating transaction: {e}")
        db.rollback()
        raise

async def sync_account_transactions(db: Session, user_id: str, account_id: str):
    try:
        logger.info(f"Syncing transactions for account_id: {account_id}, user_id: {user_id}")
        transactions_data = await get_truelayer_transactions(user_id, account_id, db)
        
        synced_transactions = []
        for transaction in transactions_data.get('results', []):
            transaction_data = TransactionCreate(
                account_id=account_id,
                transaction_id=transaction['transaction_id'],
                amount=transaction['amount'],
                currency=transaction['currency'],
                description=transaction.get('description', ''),
                transaction_type=transaction.get('transaction_type', 'Unknown'),
                transaction_category=transaction.get('transaction_category', 'Uncategorized'),
                timestamp=datetime.fromisoformat(transaction['timestamp'])
            )
            
            db_transaction = create_or_update_transaction(db, transaction_data)
            synced_transactions.append(db_transaction)
        
        logger.info(f"Synced {len(synced_transactions)} transactions for account_id: {account_id}")
        return synced_transactions
    except Exception as e:
        logger.error(f"Error syncing transactions for account_id {account_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error syncing transactions: {str(e)}")

def get_account_transactions(db: Session, account_id: str):
    logger.info(f"Getting transactions for account_id: {account_id}")
    
    if db is None:
        logger.error("Database session is None")
        raise HTTPException(status_code=500, detail="Database connection error")
    
    try:
        # Verify if the account exists
        account = db.query(AccountModel).filter(AccountModel.account_id == account_id).first()
        if account is None:
            logger.warning(f"Account not found for account_id: {account_id}")
            raise HTTPException(status_code=404, detail="Account not found")

        # Get transactions
        transactions = db.query(TransactionModel).filter(TransactionModel.account_id == account_id).all()
        
        transaction_count = len(transactions)
        logger.info(f"Found {transaction_count} transactions for account_id: {account_id}")
        
        return transactions
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error when getting transactions for account_id {account_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error accessing the database")
    except Exception as e:
        logger.error(f"Unexpected error when getting transactions for account_id {account_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# You might want to add more utility functions here as needed

# For example, a function to get the total balance across all accounts for a user
def get_total_balance(db: Session, user_id: str) -> float:
    try:
        total_balance = db.query(func.sum(AccountModel.balance)).filter(AccountModel.user_id == user_id).scalar()
        return total_balance or 0.0
    except Exception as e:
        logger.error(f"Error calculating total balance for user_id {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error calculating total balance")

# Or a function to get the most recent transaction for each account
def get_most_recent_transactions(db: Session, user_id: str) -> List[TransactionModel]:
    try:
        subquery = db.query(
            TransactionModel.account_id,
            func.max(TransactionModel.timestamp).label('max_timestamp')
        ).group_by(TransactionModel.account_id).subquery()

        most_recent_transactions = db.query(TransactionModel).join(
            subquery,
            and_(
                TransactionModel.account_id == subquery.c.account_id,
                TransactionModel.timestamp == subquery.c.max_timestamp
            )
        ).join(AccountModel, AccountModel.account_id == TransactionModel.account_id
        ).filter(AccountModel.user_id == user_id).all()

        return most_recent_transactions
    except Exception as e:
        logger.error(f"Error getting most recent transactions for user_id {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving most recent transactions")


