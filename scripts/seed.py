"""
Заполнение тестовыми данными: категории, решения, учётные записи менеджера и админа.
Запуск из корня проекта: python scripts/seed.py
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy.orm import Session  # noqa: E402

from app.db.database import SessionLocal  # noqa: E402
from app.db.migrate import upgrade_head  # noqa: E402
import app.models  # noqa: F401, E402
from app.core.enums import UserRole  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.solution import Solution, SolutionCategory  # noqa: E402


DEFAULT_COVER_IMAGE = "/assets/library-covers/ALUDAR.jpg"


def seed() -> None:
    upgrade_head()
    db: Session = SessionLocal()
    try:
        if db.query(SolutionCategory).count() == 0:
            cats = [
                SolutionCategory(name="Фундаменты", slug="foundations", sort_order=10),
                SolutionCategory(name="Каркасы", slug="frames", sort_order=20),
                SolutionCategory(name="Кровельные системы", slug="roofs", sort_order=30),
            ]
            for c in cats:
                db.add(c)
            db.commit()
            for c in cats:
                db.refresh(c)

            by_slug = {c.slug: c.id for c in cats}

            solutions = [
                Solution(
                    code="FND-001",
                    name="Фундамент свайно-ростверковый",
                    slug="pile-grillage-foundation",
                    short_description="Для слабых грунтов, устойчивость при минимальных земляных работах.",
                    description="Оптимальное решение для слабых грунтов. Обеспечивает устойчивость при минимальных земляных работах.",
                    category_id=by_slug["foundations"],
                    base_material_cost=8500,
                    base_work_cost=3200,
                    material_type="ЖБИ",
                    cover_image=DEFAULT_COVER_IMAGE,
                    is_featured=True,
                ),
                Solution(
                    code="FRM-LSTK",
                    name="Каркас ЛСТК",
                    slug="lstk-frame",
                    short_description="Быстрый монтаж, точность геометрии, минимальный вес.",
                    description="Легкий стальной тонкостенный каркас. Быстрый монтаж, точность геометрии.",
                    category_id=by_slug["frames"],
                    base_material_cost=9200,
                    base_work_cost=4100,
                    material_type="Оцинкованная сталь",
                    cover_image=DEFAULT_COVER_IMAGE,
                    is_featured=True,
                ),
                Solution(
                    code="ROOF-SW",
                    name="Кровельные сэндвич-панели",
                    slug="sandwich-roof",
                    short_description="Теплоизоляция, быстрый монтаж.",
                    description="Теплоизолированные сэндвич-панели с покрытием из оцинкованной стали.",
                    category_id=by_slug["roofs"],
                    base_material_cost=7800,
                    base_work_cost=2800,
                    material_type="ППУ + сталь",
                    cover_image=DEFAULT_COVER_IMAGE,
                    is_featured=True,
                ),
            ]
            for s in solutions:
                db.add(s)
            db.commit()

        db.query(Solution).filter(Solution.cover_image.is_(None)).update(
            {Solution.cover_image: DEFAULT_COVER_IMAGE},
            synchronize_session=False,
        )

        if db.query(User).filter(User.email == "admin@test.local").first() is None:
            db.add(
                User(
                    full_name="Администратор",
                    email="admin@test.local",
                    phone="+79990000001",
                    password_hash=hash_password("admin123"),
                    role=UserRole.ADMIN,
                )
            )
        if db.query(User).filter(User.email == "manager@test.local").first() is None:
            db.add(
                User(
                    full_name="Менеджер",
                    email="manager@test.local",
                    phone="+79990000002",
                    password_hash=hash_password("manager123"),
                    role=UserRole.MANAGER,
                )
            )
        db.commit()
        print("Seed OK: категории, решения, admin@test.local / admin123, manager@test.local / manager123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
