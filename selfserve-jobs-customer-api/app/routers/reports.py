from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_session
from app.schemas.report import ReportCreate, ReportResponse
from app.services import report_service

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_report(
    data: ReportCreate,
    db: AsyncSession = Depends(get_session),
):
    await report_service.submit_report(db, data)
    return ReportResponse(message="Report submitted successfully. Thank you for helping keep the platform safe.")
