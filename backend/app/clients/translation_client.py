from __future__ import annotations

import hashlib
from typing import Any

import httpx

from ..cache import TTLCache
from ..config import settings
from .http_helpers import with_retries

translation_cache: TTLCache[str] = TTLCache(300)


def _translation_cache_key(text: str, target_language_code: str) -> str:
    text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return f"{text_hash}:{target_language_code}"


async def translate_text(text: str, target_language_code: str) -> str:
    cache_key = _translation_cache_key(text, target_language_code)
    stale_translation = translation_cache.get_stale(cache_key)

    async def _load() -> str:
        if not settings.google_translate_api_key:
            return stale_translation or text

        params = {"key": settings.google_translate_api_key}
        payload = {"q": text, "target": target_language_code, "format": "text"}

        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                response = await with_retries(
                    lambda: client.post(
                        "https://translation.googleapis.com/language/translate/v2",
                        params=params,
                        json=payload,
                    )
                )
            data: dict[str, Any] = response.json()
            translations = data.get("data", {}).get("translations", [])
            translated = translations[0].get("translatedText") if translations else None
            return translated or stale_translation or text
        except Exception:
            return stale_translation or text

    return await translation_cache.get_or_set(cache_key, _load)
