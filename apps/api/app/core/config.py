from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "LSI-OS API"
    app_version: str = "1.0.0"
    database_url: str = "sqlite:///./lsi_os.db"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change-me-in-production-lsi-os-2024"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080
    cors_origins: str = "http://localhost:3000"
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "lsi_minio"
    minio_secret_key: str = "lsi_minio_secret"
    minio_bucket: str = "lsi-documents"
    minio_secure: bool = False
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    llm_provider: str = "auto"
    openai_model: str = "gpt-4o-mini"
    anthropic_model: str = "claude-3-5-haiku-latest"
    seed_on_startup: bool = True
    embedding_dims: int = 384

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
