"""Google Indexing API integration.

Sends URL_UPDATED / URL_DELETED notifications so Google de-indexes expired/removed
listings quickly rather than waiting for the next crawl cycle.

Credentials: set GOOGLE_INDEXING_CREDENTIALS to the full JSON of a GCP service-account
key that has been granted the "Indexing API" scope.  When the env var is empty the
module is a no-op — safe in development and staging.

All calls are fire-and-forget (asyncio.create_task) — failures are logged but never
propagate to callers.
"""

import asyncio
import json
import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

_INDEXING_API_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish"
_INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing"


def _get_access_token(credentials_json: str) -> str:
    """Synchronous: exchange service-account JSON for a short-lived Bearer token."""
    import google.auth.transport.requests
    from google.oauth2 import service_account

    info = json.loads(credentials_json)
    creds = service_account.Credentials.from_service_account_info(info, scopes=[_INDEXING_SCOPE])
    creds.refresh(google.auth.transport.requests.Request())
    return creds.token  # type: ignore[return-value]


async def _notify(url: str, url_type: str) -> None:
    settings = get_settings()
    if not settings.google_indexing_credentials:
        return
    try:
        loop = asyncio.get_event_loop()
        token = await loop.run_in_executor(None, _get_access_token, settings.google_indexing_credentials)
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                _INDEXING_API_URL,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={"url": url, "type": url_type},
            )
        if resp.status_code == 200:
            logger.info("Indexing API: %s %s", url_type, url)
        else:
            logger.warning(
                "Indexing API returned %d for %s %s: %s",
                resp.status_code,
                url_type,
                url,
                resp.text,
            )
    except Exception as exc:
        logger.warning("Indexing API notify failed for %s %s: %s", url_type, url, exc)


def notify_url_updated(url: str) -> None:
    """Fire-and-forget: tell Google the URL has new or updated content."""
    asyncio.create_task(_notify(url, "URL_UPDATED"))


def notify_url_deleted(url: str) -> None:
    """Fire-and-forget: tell Google the URL should be removed from the index."""
    asyncio.create_task(_notify(url, "URL_DELETED"))
