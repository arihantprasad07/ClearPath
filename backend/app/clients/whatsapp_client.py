from __future__ import annotations

import logging
from typing import Any

import httpx

from ..config import settings
from .http_helpers import with_retries

logger = logging.getLogger(__name__)


async def send_whatsapp_alert(phone_number: str, message: str) -> dict[str, str]:
    if (
        not settings.whatsapp_token
        or not settings.whatsapp_phone_number_id
        or not settings.whatsapp_demo_recipient
        or not phone_number
    ):
        logger.warning("WhatsApp not configured — alert payload built but not dispatched")
        return {"status": "skipped", "reason": "not_configured"}

    url = f"https://graph.facebook.com/v19.0/{settings.whatsapp_phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {settings.whatsapp_token}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "text",
        "text": {"body": message},
    }

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await with_retries(lambda: client.post(url, headers=headers, json=payload))
        response_data = response.json()
        return {"status": "sent", "message_id": str(response_data.get("messages", [{}])[0].get("id", ""))}
    except Exception as error:
        logger.error("WhatsApp dispatch failed: %s", error)
        return {"status": "failed", "reason": str(error)}
