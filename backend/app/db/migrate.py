"""Запуск Alembic из кода (seed, локальные скрипты)."""

from pathlib import Path

from alembic import command
from alembic.config import Config


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def upgrade_head() -> None:
    cfg = Config(str(project_root() / "alembic.ini"))
    command.upgrade(cfg, "head")
