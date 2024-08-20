import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, status
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Obtén la ruta del directorio actual
current_dir = os.path.dirname(os.path.abspath(__file__))

# Construye la ruta al archivo de configuración
config_path = os.path.join(current_dir, 'firebase_configuration.json')

# Verifica si el archivo existe
if not os.path.exists(config_path):
    raise FileNotFoundError(f"El archivo de configuración de Firebase no se encuentra en: {config_path}")

try:
    # Crea el objeto de credenciales
    cred = credentials.Certificate(config_path)
    
    # Inicializa Firebase Admin SDK
    firebase_admin.initialize_app(cred)
    logger.info("Firebase inicializado correctamente")
except ValueError as ve:
    logger.error(f"Error al inicializar Firebase: {ve}")
    raise
except Exception as e:
    logger.error(f"Error inesperado al inicializar Firebase: {e}")
    raise

def verify_firebase_token(token: str):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Error al verificar el token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(token: str):
    decoded_token = verify_firebase_token(token)
    return decoded_token
