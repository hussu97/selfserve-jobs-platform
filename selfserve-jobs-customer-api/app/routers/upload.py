import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_session
from app.services import profile_service, storage_service
from app.services.code_generator import generate_code

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/upload", tags=["upload"])

MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024  # 5MB
PDF_MAGIC_BYTES = b"%PDF"


class ResumeUploadResponse(BaseModel):
    """Frontend expects { resume_key: string; message: string }"""
    resume_key: str
    message: str


@router.post("/resume", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    profile_code: str = Form(...),
    edit_token: str = Form(...),
    db: AsyncSession = Depends(get_session),
):
    # Validate profile and token
    profile = await profile_service.get_profile_by_code_and_token(
        db, profile_code, edit_token
    )

    # Read file
    file_data = await file.read()

    # Validate size
    if len(file_data) > MAX_RESUME_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB.",
        )

    # Validate it's actually a PDF using magic bytes
    if not file_data.startswith(PDF_MAGIC_BYTES):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF files are accepted.",
        )

    # Validate content type too (defense in depth)
    if file.content_type and file.content_type not in ("application/pdf",):
        logger.warning(
            "Suspicious content type for resume upload: %s (profile: %s)",
            file.content_type,
            profile_code,
        )

    # Build GCS path
    unique_id = generate_code(12)
    original_filename = file.filename or "resume.pdf"
    # Sanitize filename
    safe_filename = "".join(
        c for c in original_filename if c.isalnum() or c in "._- "
    ).strip()
    if not safe_filename.endswith(".pdf"):
        safe_filename = f"{safe_filename}.pdf"

    gcs_path = f"resumes/{profile_code}/{unique_id}.pdf"

    # Upload
    await storage_service.upload_file(
        file_data=file_data,
        gcs_path=gcs_path,
        content_type="application/pdf",
    )

    # Update profile with resume path
    await profile_service.update_resume(
        db=db,
        profile_code=profile_code,
        gcs_path=gcs_path,
        original_filename=safe_filename,
    )

    # resume_key is the GCS path — the frontend stores it and can pass it back
    return ResumeUploadResponse(
        resume_key=gcs_path,
        message="Resume uploaded successfully.",
    )
