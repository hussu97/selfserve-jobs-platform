from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

# Values used by frontend: 'yes' | 'no' | 'open'
RELOCATION_PREFERENCES = Literal["yes", "no", "open"]
PROFILE_STATUSES = Literal["pending_verification", "active", "removed", "expired", "under_review"]

# Notice period values used by frontend
NOTICE_PERIODS = Literal["immediate", "1_week", "2_weeks", "1_month", "3_months", "6_months"]


class ProfileCreate(BaseModel):
    person_name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    contact_number: str = Field(..., min_length=3, max_length=30)
    brief: str = Field(default="", min_length=0)
    current_city: str = Field(..., min_length=1, max_length=100)
    current_country: str = Field(..., min_length=2, max_length=100)
    years_of_experience: int = Field(..., ge=0, le=50)
    current_title: str = Field(..., min_length=2, max_length=200)
    notice_period: NOTICE_PERIODS | None = None
    relocation_preference: RELOCATION_PREFERENCES = "open"
    linkedin_profile_link: str | None = Field(None, max_length=500)
    key_skills: list[str] = Field(default_factory=list, max_length=30)
    resume_key: str | None = Field(None, max_length=500)
    # Honeypot
    website: str | None = Field(None, exclude=True)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("key_skills", mode="before")
    @classmethod
    def validate_skills(cls, v: list) -> list:
        return [s.strip() for s in v if s.strip()]


class ProfileUpdate(BaseModel):
    person_name: str | None = Field(None, min_length=2, max_length=200)
    contact_number: str | None = Field(None, max_length=30)
    brief: str | None = Field(None, min_length=50)
    current_city: str | None = Field(None, min_length=1, max_length=100)
    current_country: str | None = Field(None, min_length=2, max_length=100)
    years_of_experience: int | None = Field(None, ge=0, le=50)
    current_title: str | None = Field(None, min_length=2, max_length=200)
    notice_period: NOTICE_PERIODS | None = None
    relocation_preference: RELOCATION_PREFERENCES | None = None
    linkedin_profile_link: str | None = Field(None, max_length=500)
    key_skills: list[str] | None = Field(None, max_length=30)

    @field_validator("key_skills", mode="before")
    @classmethod
    def validate_skills(cls, v: list | None) -> list | None:
        if v is None:
            return v
        return [s.strip() for s in v if s.strip()]


class ProfileResponse(BaseModel):
    """Full profile detail. Sensitive fields (email, contact_number) are conditionally included
    based on the requester's access level — only active recruiters receive them."""

    code: str
    person_name: str
    current_city: str
    current_country: str
    years_of_experience: int
    current_title: str
    notice_period: str | None
    relocation_preference: str
    linkedin_profile_link: str | None
    key_skills: list[str]
    brief: str
    status: str
    view_count: int
    expires_at: datetime
    created_at: datetime
    updated_at: datetime
    has_resume: bool
    is_verified: bool
    is_active: bool
    # Sensitive fields — only populated for active recruiters
    email: str | None = None
    contact_number: str | None = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_resume(cls, obj, include_sensitive: bool = False) -> "ProfileResponse":
        data = {
            "code": obj.profile_code,
            "person_name": obj.person_name,
            "current_city": obj.current_city,
            "current_country": obj.current_country,
            "years_of_experience": obj.years_of_experience,
            "current_title": obj.current_title,
            "notice_period": obj.notice_period,
            "relocation_preference": obj.relocation_preference,
            "linkedin_profile_link": obj.linkedin_profile_link,
            "key_skills": obj.key_skills or [],
            "brief": obj.brief,
            "status": obj.status,
            "view_count": obj.view_count,
            "expires_at": obj.expires_at,
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
            "has_resume": bool(obj.resume_gcs_path),
            "is_verified": obj.email_verified,
            "is_active": obj.status == "active",
            "email": obj.email if include_sensitive else None,
            "contact_number": obj.contact_number if include_sensitive else None,
        }
        return cls(**data)


class ProfileListItem(BaseModel):
    """Lightweight profile item for list responses — no email, brief, or contact info."""

    code: str
    person_name: str
    current_city: str
    current_country: str
    years_of_experience: int
    current_title: str
    notice_period: str | None
    relocation_preference: str
    key_skills: list[str]
    status: str
    view_count: int
    expires_at: datetime
    created_at: datetime
    has_resume: bool

    model_config = {"from_attributes": True}


class ProfileListResponse(BaseModel):
    items: list[ProfileListItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class ProfileCreateResponse(BaseModel):
    """Response for POST /profiles — frontend expects { code, message }."""

    code: str
    message: str


class ResumeUrlResponse(BaseModel):
    url: str
    expires_in: int
