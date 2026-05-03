"""initial schema

Revision ID: 3cb649c86c52
Revises: 
Create Date: 2026-05-03 17:03:55.530055

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '3cb649c86c52'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Первая ревизия: создаёт все таблицы по текущим SQLAlchemy-моделям.

    Autogenerate на уже заполненной БД даёт пустой diff; для «initial» удобнее
    один раз вызвать create_all внутри миграции. Дальнейшие правки — отдельные
    ревизии с op.add_column / op.create_table и т.д.
    """
    import app.models  # noqa: F401 — регистрация таблиц в Base.metadata

    from app.db.database import Base

    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    import app.models  # noqa: F401

    from app.db.database import Base

    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
