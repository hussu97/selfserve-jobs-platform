import logging
from datetime import timedelta
from pathlib import Path

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Local dev storage directory
LOCAL_STORAGE_DIR = Path("/tmp/jobs4u_uploads")


def _ensure_local_dir():
    LOCAL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


async def upload_file(
    file_data: bytes,
    gcs_path: str,
    content_type: str = "application/pdf",
) -> str:
    """Upload file to GCS or local filesystem (dev mode). Returns the gcs_path."""
    if not settings.gcs_bucket_name or settings.is_development:
        # Dev mode: save to local filesystem
        _ensure_local_dir()
        local_path = LOCAL_STORAGE_DIR / gcs_path.replace("/", "_")
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(file_data)
        logger.info("DEV MODE - File saved locally at: %s (gcs_path: %s)", local_path, gcs_path)
        return gcs_path

    try:
        from google.cloud import storage

        client = storage.Client()
        bucket = client.bucket(settings.gcs_bucket_name)
        blob = bucket.blob(gcs_path)
        blob.upload_from_string(file_data, content_type=content_type)
        logger.info("Uploaded file to GCS: gs://%s/%s", settings.gcs_bucket_name, gcs_path)
        return gcs_path
    except Exception as exc:
        logger.error("Failed to upload to GCS: %s", exc)
        raise


async def generate_signed_url(
    gcs_path: str,
    expiration_minutes: int = 15,
) -> str:
    """Generate a signed URL for a GCS object. Falls back to local file URL in dev mode."""
    if not settings.gcs_bucket_name or settings.is_development:
        # Dev mode: return a fake local URL
        logger.info("DEV MODE - Generating fake signed URL for: %s", gcs_path)
        return f"http://localhost:8080/dev-files/{gcs_path}"

    try:
        from google.cloud import storage

        client = storage.Client()
        bucket = client.bucket(settings.gcs_bucket_name)
        blob = bucket.blob(gcs_path)
        expiration = timedelta(minutes=expiration_minutes)
        url = blob.generate_signed_url(
            version="v4",
            expiration=expiration,
            method="GET",
        )
        return url
    except Exception as exc:
        logger.error("Failed to generate signed URL for %s: %s", gcs_path, exc)
        raise


async def delete_file(gcs_path: str) -> bool:
    """Delete a file from GCS or local filesystem."""
    if not settings.gcs_bucket_name or settings.is_development:
        local_path = LOCAL_STORAGE_DIR / gcs_path.replace("/", "_")
        if local_path.exists():
            local_path.unlink()
            logger.info("DEV MODE - Deleted local file: %s", local_path)
        return True

    try:
        from google.cloud import storage

        client = storage.Client()
        bucket = client.bucket(settings.gcs_bucket_name)
        blob = bucket.blob(gcs_path)
        blob.delete()
        logger.info("Deleted GCS file: gs://%s/%s", settings.gcs_bucket_name, gcs_path)
        return True
    except Exception as exc:
        logger.error("Failed to delete GCS file %s: %s", gcs_path, exc)
        return False
