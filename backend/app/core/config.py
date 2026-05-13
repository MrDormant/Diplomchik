from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Конфигурация приложения. Секреты и строка подключения к БД не задаются в коде —
    только через переменные окружения или файл `.env` в корне репозитория (см. `.env.example`).
    """

    app_name: str = "РостГидроСтрой"
    app_version: str = "0.2.0"
    debug: bool = Field(default=False)

    secret_key: str = Field(
        min_length=32,
        description="Секрет подписи JWT (переменная SECRET_KEY).",
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=60, ge=5, le=10080)

    database_url: str = Field(
        min_length=20,
        description="Строка подключения PostgreSQL (переменная DATABASE_URL).",
    )

    operator_email: str = Field(default="operator@example.com")
    smtp_host: str = Field(default="localhost")
    smtp_port: int = Field(default=1025, ge=1, le=65535)
    smtp_use_tls: bool = False
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@construction.local"

    manager_phone: str = Field(default="+74951234567")
    calc_price_per_sqm: float = Field(default=8500.0, gt=0)

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
