from __future__ import annotations

from typing import Any

import httpx

from ..cache import TTLCache
from ..config import settings
from .http_helpers import with_retries

road_cache: TTLCache[dict[str, Any]] = TTLCache(300)


async def fetch_road_status_signal() -> dict[str, Any]:
    cache_key = "nhai_roads"
    stale_signal = road_cache.get_stale(cache_key)

    async def _load() -> dict[str, Any]:
        if not settings.nhai_roads_base_url:
            return stale_signal or {
                "severity": 0.27,
                "summary": "NHAI road status unavailable. Using highway blockage fallback estimate.",
                "source": "fallback",
                "used_fallback": True,
            }

        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                response = await with_retries(lambda: client.get(settings.nhai_roads_base_url))
            payload = response.json()
            severity = float(payload.get("blockageSeverity") or payload.get("severity") or 0.24)
            return {
                "severity": max(0.0, min(severity, 1.0)),
                "summary": str(payload.get("summary") or "Live highway status signal received."),
                "source": "nhai_feed",
                "used_fallback": False,
            }
        except Exception:
            return stale_signal or {
                "severity": 0.24,
                "summary": "Road status API unavailable. Using prior blockage pattern fallback.",
                "source": "fallback",
                "used_fallback": True,
            }

    return await road_cache.get_or_set(cache_key, _load)
