from __future__ import annotations

from typing import Any

import httpx

from ..config import settings
from .http_helpers import with_retries


async def trigger_function(function_name: str, payload: dict[str, Any]) -> dict[str, str]:
    if not settings.firebase_functions_enabled or not settings.firebase_functions_base_url:
        return {"status": "skipped", "reason": "not_configured"}

    url = f"{settings.firebase_functions_base_url.rstrip('/')}/{function_name}"
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            await with_retries(lambda: client.post(url, json=payload))
        return {"status": "triggered"}
    except Exception as error:
        return {"status": "failed", "reason": str(error)}
