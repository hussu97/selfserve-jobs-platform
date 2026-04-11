import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
settings = get_settings()


@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session),
):
    if settings.is_production:
        token = await auth_service.create_login_token(db, data.email)
        background_tasks.add_task(
            email_service.send_login_email,
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
    # Fetch recruiter status to include in response for frontend routing decisions
    recruiter_status = None
    if session.user_type == "recruiter" and session.recruiter_code:
        from app.services import recruiter_service

        try:
            recruiter = await recruiter_service.get_by_code(db, session.recruiter_code)
            recruiter_status = recruiter.status
        except HTTPException:
            logger.warning("Recruiter %s not found while building verify response", session.recruiter_code)
    return LoginVerifyResponse(
        session_token=session.session_token,
        email=session.email,
        user_type=session.user_type,
        recruiter_status=recruiter_status,
    )


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
    db: AsyncSession = Depends(get_session),
):
    recruiter_status = None
    if current_session.user_type == "recruiter" and current_session.recruiter_code:
        from app.services import recruiter_service

        try:
            recruiter = await recruiter_service.get_by_code(db, current_session.recruiter_code)
            recruiter_status = recruiter.status
        except HTTPException:
            logger.warning("Recruiter %s not found while building /me response", current_session.recruiter_code)
    return MeResponse(
        email=current_session.email,
        user_type=current_session.user_type,
        recruiter_code=current_session.recruiter_code,
        recruiter_status=recruiter_status,
    )


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
