from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.router import router as api_router
from app.db.database import engine, Base
from app.models import user  

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Backend работает 🚀"}

Base.metadata.create_all(bind=engine)