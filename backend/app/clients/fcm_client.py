from __future__ import annotations

import logging
import asyncio
from typing import Any

import httpx

from ..config import settings
from .bigquery_client import _load_access_token
from .http_helpers import with_retries

logger = logging.getLogger(__name__)


async def send_push_notification(title: str, body: str) -> dict[str, str]:
    if not settings.fcm_demo_token:
        logger.warning("FCM not configured - push payload built but not dispatched")
        return {"status": "skipped", "reason": "not_configured"}

    payload: dict[str, Any] = {"message": {"token": settings.fcm_demo_token, "notification": {"title": title, "body": body}, "data": {"channel": "backup_push"}}}
    try:
        project_id = settings.fcm_project_id or settings.firebase_project_id
        if project_id:
            token = await asyncio.to_thread(_load_access_token)
            if token:
                headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
                url = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"
                async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                    await with_retries(lambda: client.post(url, headers=headers, json=payload))
                return {"status": "sent", "provider": "fcm_v1"}

        if not settings.fcm_server_key:
            logger.warning("FCM credentials unavailable - push payload built but not dispatched")
            return {"status": "skipped", "reason": "credentials_unavailable"}

        legacy_payload = {
            "to": settings.fcm_demo_token,
            "notification": {"title": title, "body": body},
            "data": {"channel": "backup_push"},
        }
        headers = {"Authorization": f"key={settings.fcm_server_key}", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await with_retries(lambda: client.post("https://fcm.googleapis.com/fcm/send", headers=headers, json=legacy_payload))
        response_data = response.json()
        if response_data.get("failure"):
            return {"status": "failed", "reason": "delivery_failed"}
        return {"status": "sent", "provider": "fcm_legacy"}
    except Exception as error:
        logger.warning("FCM dispatch failed: %s", error)
        return {"status": "failed", "reason": str(error)}
