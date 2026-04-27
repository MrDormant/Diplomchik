import os

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.database import Base, engine
from app.db.schema_patches import apply_schema_patches
import app.models  # noqa: F401 — регистрация моделей для metadata.create_all


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)

app.include_router(api_router, prefix="/api/v1")

_static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(_static_dir):
    app.mount("/assets", StaticFiles(directory=_static_dir), name="assets")


@app.get("/")
async def index_page():
    path = os.path.join(_static_dir, "index.html")
    if os.path.isfile(path):
        return FileResponse(path)
    return {"message": settings.app_name, "api": "/api/v1"}


@app.get("/calculator.html")
async def calculator_page():
    path = os.path.join(_static_dir, "calculator.html")
    if os.path.isfile(path):
        return FileResponse(path)
    return {"detail": "calculator.html not found"}


@app.get("/library.html")
async def library_page():
    path = os.path.join(_static_dir, "library.html")
    if os.path.isfile(path):
        return FileResponse(path)
    return {"detail": "library.html not found"}


@app.get("/cabinet.html")
async def cabinet_page():
    path = os.path.join(_static_dir, "cabinet.html")
    if os.path.isfile(path):
        return FileResponse(path)
    return {"detail": "cabinet.html not found"}


@app.get("/admin.html")
async def admin_page():
    path = os.path.join(_static_dir, "admin.html")
    if os.path.isfile(path):
        return FileResponse(path)
    return {"detail": "admin.html not found"}


@app.get("/previews")
async def previews_page():
    path = os.path.join(_static_dir, "previews", "index.html")
    if os.path.isfile(path):
        return FileResponse(path)
    return {"detail": "previews/index.html not found"}


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    apply_schema_patches(engine)
