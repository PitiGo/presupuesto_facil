from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth,accounts  # Cambiado a importación relativa

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
#app.include_router(budgets.router)

@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de Presupuesto Fácil"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
