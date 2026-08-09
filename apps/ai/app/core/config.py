from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "EIOS AI"
    app_version: str = "2.0.0"
    database_url: str = "sqlite:///./eios_ai.db"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change-me-in-production-eios-2026"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080
    cors_origins: str = "http://localhost:3000,http://localhost:4000"
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "eios_minio"
    minio_secret_key: str = "eios_minio_secret"
    minio_bucket: str = "eios-documents"
    minio_secure: bool = False
    openai_api_key: str = ""
    llm_provider: str = "auto"
    openai_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    seed_on_startup: bool = True
    embedding_dims: int = 384
    nest_api_url: str = "http://localhost:4000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
