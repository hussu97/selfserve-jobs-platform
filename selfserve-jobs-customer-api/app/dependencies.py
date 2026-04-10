from collections.abc import AsyncGenerator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.auth_session import AuthSession


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db():
        yield session


async def require_edit_token(x_edit_token: str = Header(..., alias="X-Edit-Token")) -> str:
    if not x_edit_token or len(x_edit_token.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Edit-Token header is required",
        )
    return x_edit_token.strip()


async def get_current_session(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_session),
) -> AuthSession:
    """Parse 'Bearer {token}' header and return the validated session."""
    from app.services import auth_service

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or invalid",
        )
    token = authorization.removeprefix("Bearer ").strip()
    session = await auth_service.validate_session(db, token)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )
    return session


async def get_optional_session(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_session),
) -> AuthSession | None:
    """Like get_current_session but returns None instead of 401 if not authenticated."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    from app.services import auth_service

    return await auth_service.validate_session(db, token)


async def require_active_recruiter(
    session: AuthSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_session),
) -> AuthSession:
    """Require the caller to be an authenticated, admin-approved recruiter."""
    if session.user_type != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires a verified recruiter account.",
        )
    from app.services import recruiter_service

    recruiter = await recruiter_service.get_by_email(db, session.email)
    if not recruiter or recruiter.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your recruiter account is pending approval. You will be notified by email once approved.",
        )
    return session
