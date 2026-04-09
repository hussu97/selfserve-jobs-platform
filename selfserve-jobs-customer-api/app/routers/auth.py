from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_current_session, get_session
from app.models.auth_session import AuthSession
from app.schemas.auth import (
    EntitiesResponse,
    EntityItem,
    LoginRequest,
    LoginResponse,
    LoginVerifyResponse,
    MeResponse,
)
from app.schemas.common import MessageResponse
from app.services import auth_service, email_service

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
settings = get_settings()


@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_session),
):
    if settings.is_production:
        token = await auth_service.create_login_token(db, data.email)
        await email_service.send_login_email(
            db=db,
            email=data.email,
            login_token=token.token,
            frontend_url=settings.frontend_url,
        )
        return LoginResponse(message="Check your email for a login link.")
    else:
        # Non-production: skip email, create session immediately
        session = await auth_service.create_session(db, data.email)
        return LoginResponse(
            message="Logged in automatically (non-production).",
            session_token=session.session_token,
        )


@router.post("/verify", response_model=LoginVerifyResponse)
async def verify_login(
    token: str,
    db: AsyncSession = Depends(get_session),
):
    session = await auth_service.verify_login_token(db, token)
    return LoginVerifyResponse(session_token=session.session_token, email=session.email)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    db: AsyncSession = Depends(get_session),
    current_session: AuthSession = Depends(get_current_session),
):
    await auth_service.delete_session(db, current_session.session_token)
    return MessageResponse(message="Logged out successfully.")


@router.get("/me", response_model=MeResponse)
async def me(
    current_session: AuthSession = Depends(get_current_session),
):
    return MeResponse(email=current_session.email)


@router.get("/entities", response_model=EntitiesResponse)
async def get_entities(
    db: AsyncSession = Depends(get_session),
    current_session: AuthSession = Depends(get_current_session),
):
    data = await auth_service.get_entities_for_session(db, current_session.email)
    return EntitiesResponse(
        jobs=[EntityItem(**item) for item in data["jobs"]],
        profiles=[EntityItem(**item) for item in data["profiles"]],
    )
