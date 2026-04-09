import logging

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.services import storage_service
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
):
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
        logger.warning("Suspicious content type for resume upload: %s", file.content_type)

    # Build GCS path — profile_code not known yet at upload time (pre-creation upload)
    unique_id = generate_code(12)
    gcs_path = f"resumes/{unique_id}.pdf"

    # Upload
    await storage_service.upload_file(
        file_data=file_data,
        gcs_path=gcs_path,
        content_type="application/pdf",
    )

    return ResumeUploadResponse(
        resume_key=gcs_path,
        message="Resume uploaded successfully.",
    )
