from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class LoginResponse(BaseModel):
    message: str
    session_token: str | None = None


class LoginVerifyResponse(BaseModel):
    session_token: str
    email: str


class MeResponse(BaseModel):
    email: str


class EntityItem(BaseModel):
    entity_type: str
    code: str
    title: str
    status: str
    edit_token: str
    view_count: int
    created_at: datetime
    expires_at: datetime


class EntitiesResponse(BaseModel):
    jobs: list[EntityItem]
    profiles: list[EntityItem]
