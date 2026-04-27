"""
Лёгкие правки схемы без Alembic: create_all не добавляет колонки к существующим таблицам.
Вызывается при старте приложения.
"""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def apply_schema_patches(engine: Engine) -> None:
    if engine.dialect.name != "postgresql":
        return

    with engine.begin() as conn:
        insp = inspect(conn)

        if insp.has_table("service_requests"):
            cols = {c["name"]: c for c in insp.get_columns("service_requests")}

            if "guest_full_name" not in cols:
                conn.execute(
                    text(
                        "ALTER TABLE service_requests "
                        "ADD COLUMN guest_full_name VARCHAR(255) NULL"
                    )
                )
            if "guest_phone" not in cols:
                conn.execute(
                    text(
                        "ALTER TABLE service_requests "
                        "ADD COLUMN guest_phone VARCHAR(40) NULL"
                    )
                )

            cols = {c["name"]: c for c in insp.get_columns("service_requests")}
            uid = cols.get("user_id")
            if uid is not None and uid.get("nullable") is False:
                conn.execute(
                    text(
                        "ALTER TABLE service_requests "
                        "ALTER COLUMN user_id DROP NOT NULL"
                    )
                )

        if insp.has_table("solutions"):
            sol_cols = {c["name"] for c in insp.get_columns("solutions")}
            if "cover_image" not in sol_cols:
                conn.execute(
                    text(
                        "ALTER TABLE solutions "
                        "ADD COLUMN cover_image VARCHAR(512) NULL"
                    )
                )
