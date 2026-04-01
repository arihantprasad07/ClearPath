from __future__ import annotations

import json

import httpx

from ..config import settings
from ..privacy import anonymize_payload
from .http_helpers import with_retries


async def generate_explanation(prompt_payload: dict, fallback: dict) -> dict:
    if not settings.gemini_api_key:
        return fallback

    url = f"{settings.gemini_base_url}/{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    safe_prompt_payload = anonymize_payload(prompt_payload)
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await with_retries(lambda: client.post(url, json=safe_prompt_payload))
            data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]  # type: ignore[index]
        parsed = json.loads(text)
        return parsed
    except Exception:
        return fallback
