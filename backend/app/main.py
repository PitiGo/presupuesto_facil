import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth,accounts,budgets 
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:3001"],  # Ajusta esto según tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(budgets.router) 


# Configuración del logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Configurar el logger para tu aplicación
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Asegúrate de que los loggers de tus módulos también estén configurados
logging.getLogger('app.services.accounts_service').setLevel(logging.DEBUG)
logging.getLogger('app.routers.accounts').setLevel(logging.DEBUG)


@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de Presupuesto Fácil"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
