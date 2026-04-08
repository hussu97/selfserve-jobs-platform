from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_session
from app.models.job import Job
from app.models.profile import Profile
from app.utils.countries import COUNTRIES
from app.utils.skills import SKILLS

router = APIRouter(prefix="/api/v1", tags=["meta"])


class CountryItem(BaseModel):
    code: str
    name: str


class StatsResponse(BaseModel):
    active_jobs: int
    active_profiles: int


@router.get("/countries", response_model=list[CountryItem])
async def get_countries():
    return COUNTRIES


@router.get("/skills", response_model=list[str])
async def get_skills():
    return SKILLS


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_session)):
    jobs_result = await db.execute(select(func.count(Job.id)).where(Job.status == "active"))
    active_jobs = jobs_result.scalar_one()

    profiles_result = await db.execute(select(func.count(Profile.id)).where(Profile.status == "active"))
    active_profiles = profiles_result.scalar_one()

    return StatsResponse(active_jobs=active_jobs, active_profiles=active_profiles)
