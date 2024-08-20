from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de la base de datos para PostgreSQL
# Formato: postgresql://user:password@localhost/dbname
SQLALCHEMY_DATABASE_URL = "postgresql://dantecollazzi:1983@localhost/presupuesto_facil"

# Crear el motor de la base de datos
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base para modelos declarativos
Base = declarative_base()

# Dependencia de la sesión de la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
