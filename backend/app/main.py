from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
import app.models  # noqa: F401 — регистрация моделей для Alembic / связей ORM


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)

app.include_router(api_router, prefix="/api/v1")

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
_frontend_dir = _PROJECT_ROOT / "frontend"
_html_dir = _frontend_dir / "html"

if _frontend_dir.is_dir():
    app.mount("/assets", StaticFiles(directory=_frontend_dir), name="assets")


def _page_response(filename: str):
    path = _html_dir / filename
    if path.is_file():
        return FileResponse(path)
    return {"detail": f"{filename} not found"}


@app.get("/")
async def index_page():
    path = _html_dir / "index.html"
    if path.is_file():
        return FileResponse(path)
    return {"message": settings.app_name, "api": "/api/v1"}


@app.get("/calculator.html")
async def calculator_page():
    return _page_response("calculator.html")


@app.get("/library.html")
async def library_page():
    return _page_response("library.html")


@app.get("/projects.html")
async def projects_page():
    return _page_response("projects.html")


@app.get("/cabinet.html")
async def cabinet_page():
    return _page_response("cabinet.html")


@app.get("/admin.html")
async def admin_page():
    return _page_response("admin.html")
