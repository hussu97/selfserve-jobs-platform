from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class AdminLoginRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class RejectionReasonItem(BaseModel):
    code: str
    name: str

    model_config = {"from_attributes": True}


class RejectRecruiterRequest(BaseModel):
    reason_code: str
    comment: str | None = None


class AdminUserItem(BaseModel):
    profile_code: str
    person_name: str
    email: str
    email_verified: bool
    status: str
    current_title: str | None
    created_at: datetime
    view_count: int

    model_config = {"from_attributes": True}


class AdminUserListResponse(BaseModel):
    items: list[AdminUserItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class AdminRecruiterItem(BaseModel):
    recruiter_code: str
    name: str
    email: str
    linkedin_profile_url: str
    status: str
    rejection_reason_code: str | None
    rejection_comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminRecruiterListResponse(BaseModel):
    items: list[AdminRecruiterItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class AdminReportItem(BaseModel):
    report_code: str
    entity_type: str
    entity_code: str
    reporter_email: str
    reason: str
    details: str | None
    status: str
    created_at: datetime
    entity_title: str | None = None

    model_config = {"from_attributes": True}


class AdminReportListResponse(BaseModel):
    items: list[AdminReportItem]
    total: int
    page: int
    per_page: int
    total_pages: int
