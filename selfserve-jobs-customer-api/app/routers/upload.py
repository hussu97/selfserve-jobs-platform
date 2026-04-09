import logging

from fastapi import APIRouter
from pydantic import BaseModel

from app.services import storage_service
from app.services.code_generator import generate_code

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/upload", tags=["upload"])


class ResumeSignedUrlResponse(BaseModel):
    """Response for POST /upload/resume/signed-url."""

    resume_key: str
    upload_url: str | None


@router.post("/resume/signed-url", response_model=ResumeSignedUrlResponse)
async def get_resume_signed_upload_url():
    """Return a v4 GCS signed PUT URL so the browser uploads the PDF directly to GCS.

    In dev mode (no GCS bucket) upload_url is None — the frontend skips the
    upload step and passes resume_key as a placeholder reference.
    """
    unique_id = generate_code(12)
    gcs_path = f"resumes/{unique_id}.pdf"

    upload_url = await storage_service.generate_signed_upload_url(
        gcs_path=gcs_path,
        content_type="application/pdf",
    )

    return ResumeSignedUrlResponse(resume_key=gcs_path, upload_url=upload_url)
