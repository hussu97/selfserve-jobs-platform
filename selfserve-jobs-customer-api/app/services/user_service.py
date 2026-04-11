from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_sensitive import UserSensitive
from app.services.code_generator import generate_code


async def get_or_create_user(
    db: AsyncSession,
    email: str,
    phone: str | None = None,
) -> UserSensitive:
    """Return the UserSensitive row for *email*, creating it if it does not exist.

    If the row already exists and *phone* is provided, the stored phone is
    updated in-place (profile posters may update their number on re-submission).
    """
    result = await db.execute(select(UserSensitive).where(UserSensitive.user_email == email))
    user = result.scalar_one_or_none()

    if user is None:
        user = UserSensitive(
            user_code=generate_code(12),
            user_email=email,
            user_phone=phone,
        )
        db.add(user)
        await db.flush()
    elif phone is not None and user.user_phone != phone:
        user.user_phone = phone
        user.updated_at = datetime.now(UTC)
        await db.flush()

    return user


async def get_by_email(db: AsyncSession, email: str) -> UserSensitive | None:
    result = await db.execute(select(UserSensitive).where(UserSensitive.user_email == email))
    return result.scalar_one_or_none()


async def get_by_code(db: AsyncSession, user_code: str) -> UserSensitive | None:
    result = await db.execute(select(UserSensitive).where(UserSensitive.user_code == user_code))
    return result.scalar_one_or_none()
