from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class RecruiterRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    linkedin_profile_url: str = Field(..., max_length=500)
    # Honeypot field — must be empty
    website: str | None = Field(None, exclude=True)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("linkedin_profile_url", mode="before")
    @classmethod
    def validate_linkedin(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("LinkedIn URL must start with http:// or https://")
        return v


class RecruiterResponse(BaseModel):
    code: str
    email: str
    name: str
    linkedin_profile_url: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm(cls, obj) -> "RecruiterResponse":
        return cls(
            code=obj.recruiter_code,
            email=obj.email,
            name=obj.name,
            linkedin_profile_url=obj.linkedin_profile_url,
            status=obj.status,
            created_at=obj.created_at,
        )


class RecruiterRegisterResponse(BaseModel):
    code: str
    message: str
