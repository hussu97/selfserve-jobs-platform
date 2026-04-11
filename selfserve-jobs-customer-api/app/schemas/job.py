from datetime import date, datetime, timedelta
from typing import Literal
from urllib.parse import urlparse

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.constants import JOB_EXPIRY_DAYS

EMPLOYMENT_TYPES = Literal["full_time", "part_time", "contract", "consulting", "internship", "freelance", "remote"]
CONTACT_METHODS = Literal["email", "url"]
JOB_STATUSES = Literal["pending_verification", "active", "removed", "expired", "under_review"]

SALARY_CURRENCIES = Literal["AED", "USD", "EUR", "GBP", "INR", "SAR", "QAR", "BHD", "KWD", "OMR", "EGP"]


class JobCreate(BaseModel):
    job_title: str = Field(..., min_length=2, max_length=200)
    company_name: str = Field(..., min_length=1, max_length=200)
    company_city: str = Field(..., min_length=1, max_length=100)
    company_country: str = Field(..., min_length=2, max_length=100)
    employment_type: EMPLOYMENT_TYPES
    deadline_date: date | None = None
    description: str = Field(..., min_length=50)
    key_skills: list[str] = Field(default_factory=list, max_length=30)
    contact_method: CONTACT_METHODS
    contact_email: EmailStr | None = None
    contact_url: str | None = Field(None, max_length=2048)
    # Optional salary range
    salary_min: int | None = Field(None, ge=0)
    salary_max: int | None = Field(None, ge=0)
    salary_currency: SALARY_CURRENCIES | None = None
    # Honeypot field — must be empty
    website: str | None = Field(None, exclude=True)

    @field_validator("contact_url", mode="after")
    @classmethod
    def validate_contact_url_scheme(cls, v: str | None) -> str | None:
        if v is not None:
            scheme = urlparse(v).scheme
            if scheme not in ("http", "https"):
                raise ValueError("contact_url must use http or https scheme")
        return v

    @field_validator("deadline_date", mode="after")
    @classmethod
    def validate_deadline(cls, v: date | None) -> date | None:
        if v is None:
            return v
        today = date.today()
        if v < today:
            raise ValueError("Application deadline cannot be in the past")
        max_date = today + timedelta(days=JOB_EXPIRY_DAYS)
        if v > max_date:
            raise ValueError(f"Application deadline cannot exceed the listing expiry ({JOB_EXPIRY_DAYS} days)")
        return v

    @field_validator("key_skills", mode="before")
    @classmethod
    def validate_skills(cls, v: list) -> list:
        return [s.strip() for s in v if s.strip()]

    @model_validator(mode="after")
    def validate_contact_and_salary(self) -> "JobCreate":
        if self.contact_method == "email" and not self.contact_email:
            raise ValueError("contact_email is required when contact_method is 'email'")
        if self.contact_method == "url" and not self.contact_url:
            raise ValueError("contact_url is required when contact_method is 'url'")
        if (self.salary_min is not None or self.salary_max is not None) and not self.salary_currency:
            raise ValueError("salary_currency is required when salary_min or salary_max is set")
        if self.salary_min is not None and self.salary_max is not None and self.salary_min > self.salary_max:
            raise ValueError("salary_min must be less than or equal to salary_max")
        return self


class JobUpdate(BaseModel):
    job_title: str | None = Field(None, min_length=2, max_length=200)
    company_name: str | None = Field(None, min_length=1, max_length=200)
    company_city: str | None = Field(None, min_length=1, max_length=100)
    company_country: str | None = Field(None, min_length=2, max_length=100)
    employment_type: EMPLOYMENT_TYPES | None = None
    deadline_date: date | None = None
    description: str | None = Field(None, min_length=50)
    key_skills: list[str] | None = Field(None, max_length=30)
    contact_method: CONTACT_METHODS | None = None
    contact_email: EmailStr | None = None
    contact_url: str | None = Field(None, max_length=2048)
    salary_min: int | None = Field(None, ge=0)
    salary_max: int | None = Field(None, ge=0)
    salary_currency: SALARY_CURRENCIES | None = None

    @field_validator("contact_url", mode="after")
    @classmethod
    def validate_contact_url_scheme(cls, v: str | None) -> str | None:
        if v is not None:
            scheme = urlparse(v).scheme
            if scheme not in ("http", "https"):
                raise ValueError("contact_url must use http or https scheme")
        return v

    @field_validator("key_skills", mode="before")
    @classmethod
    def validate_skills(cls, v: list | None) -> list | None:
        if v is None:
            return v
        return [s.strip() for s in v if s.strip()]

    @model_validator(mode="after")
    def validate_contact_consistency(self) -> "JobUpdate":
        # Only enforce contact consistency when contact_method is explicitly being updated
        if self.contact_method == "email" and self.contact_email is None:
            raise ValueError("contact_email is required when setting contact_method to 'email'")
        if self.contact_method == "url" and self.contact_url is None:
            raise ValueError("contact_url is required when setting contact_method to 'url'")
        return self


class JobResponse(BaseModel):
    """Full job detail — used for GET /jobs/{code}, PUT, DELETE responses."""

    code: str
    job_title: str
    company_name: str
    company_city: str
    company_country: str
    employment_type: str
    deadline_date: date | None
    description: str
    key_skills: list[str]
    contact_method: str
    contact_email: str | None
    contact_url: str | None
    salary_min: int | None
    salary_max: int | None
    salary_currency: str | None
    recruiter_code: str | None
    status: str
    view_count: int
    renewal_count: int
    expires_at: datetime
    created_at: datetime
    updated_at: datetime
    is_verified: bool
    is_active: bool

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):  # type: ignore[override]
        if hasattr(obj, "__dict__") or hasattr(obj, "__table__"):
            data = {
                "code": obj.job_code,
                "job_title": obj.job_title,
                "company_name": obj.company_name,
                "company_city": obj.company_city,
                "company_country": obj.company_country,
                "employment_type": obj.employment_type,
                "deadline_date": obj.deadline_date,
                "description": obj.description,
                "key_skills": obj.key_skills or [],
                "contact_method": obj.contact_method,
                "contact_email": obj.contact_email,
                "contact_url": obj.contact_url,
                "salary_min": getattr(obj, "salary_min", None),
                "salary_max": getattr(obj, "salary_max", None),
                "salary_currency": getattr(obj, "salary_currency", None),
                "recruiter_code": getattr(obj, "recruiter_code", None),
                "status": obj.status,
                "view_count": obj.view_count,
                "renewal_count": getattr(obj, "renewal_count", 0),
                "expires_at": obj.expires_at,
                "created_at": obj.created_at,
                "updated_at": obj.updated_at,
                "is_verified": obj.email_verified,
                "is_active": obj.status == "active",
            }
            return cls(**data)
        return super().model_validate(obj, *args, **kwargs)


class JobListItem(BaseModel):
    """Lightweight job item for list responses — no description, no contact info."""

    code: str
    job_title: str
    company_name: str
    company_city: str
    company_country: str
    employment_type: str
    deadline_date: date | None
    key_skills: list[str]
    salary_min: int | None
    salary_max: int | None
    salary_currency: str | None
    status: str
    view_count: int
    expires_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):  # type: ignore[override]
        if hasattr(obj, "__dict__") or hasattr(obj, "__table__"):
            data = {
                "code": obj.job_code,
                "job_title": obj.job_title,
                "company_name": obj.company_name,
                "company_city": obj.company_city,
                "company_country": obj.company_country,
                "employment_type": obj.employment_type,
                "deadline_date": obj.deadline_date,
                "key_skills": obj.key_skills or [],
                "salary_min": getattr(obj, "salary_min", None),
                "salary_max": getattr(obj, "salary_max", None),
                "salary_currency": getattr(obj, "salary_currency", None),
                "status": obj.status,
                "view_count": obj.view_count,
                "expires_at": obj.expires_at,
                "created_at": obj.created_at,
            }
            return cls(**data)
        return super().model_validate(obj, *args, **kwargs)


class JobListResponse(BaseModel):
    items: list[JobListItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class JobCreateResponse(BaseModel):
    """Response for POST /jobs — frontend expects { code, message }."""

    code: str
    message: str
