from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str  # required — set via DATABASE_URL env var; no default to avoid credential exposure
    frontend_url: str = "http://localhost:3000"
    gcs_bucket_name: str = ""
    resend_api_key: str = ""
    resend_from_email: str = ""
    environment: str = "development"
    admin_notification_email: str = ""
    admin_emails: str = ""
    sentry_dsn: str = ""
    log_format: str = "json"  # "json" in production, "text" in development
    internal_api_secret: str = ""  # shared secret for /api/v1/internal/* cron endpoints

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

    @property
    def admin_email_list(self) -> list[str]:
        return [e.strip().lower() for e in self.admin_emails.split(",") if e.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
