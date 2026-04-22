from __future__ import annotations

import json
import re

import httpx

from ..config import settings
from ..privacy import anonymize_payload
from .http_helpers import with_retries


def _extract_json_object(raw_text: str) -> dict:
    """Extract the first JSON object from a Gemini text response."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


async def generate_explanation(prompt_payload: dict, fallback: dict) -> dict:
    """Generate a structured explanation with a resilient JSON fallback path."""
    if not settings.gemini_api_key:
        return fallback

    url = f"{settings.gemini_base_url}/{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    safe_prompt_payload = anonymize_payload(prompt_payload)
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await with_retries(lambda: client.post(url, json=safe_prompt_payload))
            data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]  # type: ignore[index]
        parsed = _extract_json_object(text)
        return parsed
    except Exception:
        return fallback
