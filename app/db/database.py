import os

os.environ.setdefault("PGCLIENTENCODING", "UTF8")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings


def _sqlalchemy_database_url(url: str) -> str:
    """Docker и .env используют postgresql://…; для движка нужен драйвер psycopg (v3)."""
    if url.startswith("postgresql+psycopg://"):
        return url
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    return url


engine = create_engine(_sqlalchemy_database_url(settings.database_url))

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
