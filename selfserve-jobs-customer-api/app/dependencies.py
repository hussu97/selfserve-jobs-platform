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
