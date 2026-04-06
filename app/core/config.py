from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Industrial Construction Service"
    app_version: str = "0.1.0"
    debug: bool = True
    
    # Настройки безопасности
    secret_key: str = "supersecretkey"  # В продакшене — через .env!
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    
    # База данных
    database_url: str = "postgresql://postgres:0000@localhost:5432/construction_db"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()