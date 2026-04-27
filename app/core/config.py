from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Industrial Construction Service"
    app_version: str = "0.2.0"
    debug: bool = True

    secret_key: str = "supersecretkey"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    database_url: str = "postgresql://postgres:postgres@127.0.0.1:5432/construction_db"

    operator_email: str = "operator@example.com"
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_use_tls: bool = False
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@construction.local"

    manager_phone: str = "+74951234567"
    calc_price_per_sqm: float = 8500.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
