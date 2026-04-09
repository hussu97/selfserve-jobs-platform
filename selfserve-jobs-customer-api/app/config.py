from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://jobs4u:jobs4u_dev@localhost:5432/jobs4u"
    frontend_url: str = "http://localhost:3000"
    gcs_bucket_name: str = ""
    resend_api_key: str = ""
    resend_from_email: str = "hirebridge <noreply@hirebridgeuae.com>"
    environment: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
