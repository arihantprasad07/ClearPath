from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from ..config import settings
from ..privacy import anonymize_payload, hash_value
from .http_helpers import with_retries

logger = logging.getLogger(__name__)

try:
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account
except Exception:  # pragma: no cover - optional runtime dependency fallback
    Request = None
    service_account = None


def _resolve_bigquery_project_id() -> str | None:
    return settings.bigquery_project_id or settings.firebase_project_id


def _build_bigquery_insert_url() -> str | None:
    project_id = _resolve_bigquery_project_id()
    if not project_id or not settings.bigquery_dataset or not settings.bigquery_table:
        return None
    return (
        f"https://bigquery.googleapis.com/bigquery/v2/projects/{project_id}"
        f"/datasets/{settings.bigquery_dataset}/tables/{settings.bigquery_table}/insertAll"
    )


def _load_access_token() -> str | None:
    if not settings.firebase_credentials_path or not service_account or not Request:
        return None

    credentials_obj = service_account.Credentials.from_service_account_file(
        settings.firebase_credentials_path,
        scopes=["https://www.googleapis.com/auth/bigquery.insertdata"],
    )
    credentials_obj.refresh(Request())
    return credentials_obj.token


async def export_operational_event(row: dict[str, Any]) -> dict[str, str]:
    url = _build_bigquery_insert_url()
    if not url:
        return {"status": "skipped", "reason": "not_configured"}

    token = await asyncio.to_thread(_load_access_token)
    if not token:
        return {"status": "skipped", "reason": "credentials_unavailable"}

    analytics_row = {
        "eventId": row.get("id"),
        "shipmentHash": hash_value(str(row.get("shipmentId") or "none")),
        "eventType": row.get("eventType"),
        "status": row.get("status"),
        "actor": row.get("actor"),
        "detail": anonymize_payload(row.get("detail")),
        "metadata": anonymize_payload(row.get("metadata", {})),
        "createdAt": row.get("createdAt"),
    }
    payload = {"kind": "bigquery#tableDataInsertAllRequest", "rows": [{"json": analytics_row}]}
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await with_retries(lambda: client.post(url, json=payload, headers=headers))
        response_data = response.json()
        if response_data.get("insertErrors"):
            logger.warning("BigQuery export returned insert errors.")
            return {"status": "failed", "reason": "insert_errors"}
        return {"status": "exported"}
    except Exception as error:
        logger.warning("BigQuery export failed: %s", error)
        return {"status": "failed", "reason": str(error)}
