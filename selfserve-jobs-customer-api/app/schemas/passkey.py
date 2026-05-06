from datetime import datetime

from pydantic import BaseModel, Field


class PasskeyRegisterBeginResponse(BaseModel):
    session_key: str
    options: dict


class PasskeyRegisterCompleteRequest(BaseModel):
    session_key: str
    credential: dict
    label: str | None = Field(None, max_length=100)


class PasskeyAuthBeginRequest(BaseModel):
    email: str


class PasskeyAuthBeginResponse(BaseModel):
    session_key: str
    options: dict


class PasskeyAuthCompleteRequest(BaseModel):
    session_key: str
    credential: dict


class PasskeyAuthCompleteResponse(BaseModel):
    session_token: str
    email: str
    user_type: str | None
    recruiter_code: str | None
    recruiter_status: str | None


class PasskeyAvailabilityResponse(BaseModel):
    has_passkey: bool


class PasskeyItem(BaseModel):
    credential_id_b64: str
    label: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PasskeyListResponse(BaseModel):
    items: list[PasskeyItem]
