from collections.abc import AsyncGenerator

from fastapi import Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db


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
