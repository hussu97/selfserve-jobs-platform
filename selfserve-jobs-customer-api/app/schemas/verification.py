from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator


class VerificationRequest(BaseModel):
    """Frontend sends { code: string } to POST /verify."""

    code: str


class VerificationResponse(BaseModel):
    """
    Response for POST /verify.
    Frontend expects: { success, message, entity_type?, code?, session_token? }
    """

    success: bool
    message: str
    entity_type: str | None = None
    code: str | None = None
    session_token: str | None = None
    email: str | None = None
    recruiter_status: str | None = None  # present when entity_type == "recruiter"
    user_type: str | None = None  # "recruiter" | "admin" | None — from the created session


class ResendVerificationRequest(BaseModel):
    """
    Frontend sends { email, entity_type } to POST /verify/resend.
    entity_code is optional — when missing the API will look up pending
    entities for the given email + entity_type.
    """

    entity_type: Literal["job", "profile"]
    email: EmailStr
    entity_code: str | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class ManagementLinkRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class ValidateTokenRequest(BaseModel):
    entity_type: Literal["job", "profile"]
    entity_code: str
    token: str


class ValidateTokenResponse(BaseModel):
    """
    Response for GET /manage/validate-token.
    Frontend expects: { valid, entity_type, code }
    """

    valid: bool
    entity_type: str | None = None
    code: str | None = None
