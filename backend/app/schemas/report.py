from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# Frontend ReportReason: 'spam' | 'inappropriate' | 'misleading' | 'duplicate' | 'other'
REPORT_REASONS = Literal["spam", "inappropriate", "misleading", "duplicate", "scam", "other"]


class ReportCreate(BaseModel):
    entity_type: Literal["job", "profile"]
    entity_code: str
    reporter_email: EmailStr
    reason: REPORT_REASONS
    details: Optional[str] = Field(None, max_length=2000)

    @field_validator("reporter_email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class ReportResponse(BaseModel):
    message: str

    model_config = {"from_attributes": True}
