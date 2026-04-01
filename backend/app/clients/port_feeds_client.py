from __future__ import annotations

from typing import Any

import httpx

from ..cache import TTLCache
from ..config import settings
from .http_helpers import with_retries

port_cache: TTLCache[dict[str, Any]] = TTLCache(300)


async def fetch_port_congestion_signal() -> dict[str, Any]:
    cache_key = "port_congestion"
    stale_signal = port_cache.get_stale(cache_key)

    async def _load() -> dict[str, Any]:
        if not settings.port_feeds_base_url:
            return stale_signal or {
                "severity": 0.33,
                "summary": "Port wait-time feeds unavailable. Using corridor congestion fallback.",
                "source": "fallback",
                "used_fallback": True,
            }

        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                response = await with_retries(lambda: client.get(settings.port_feeds_base_url))
            payload = response.json()
            congestion = float(payload.get("congestionIndex") or payload.get("severity") or 0.28)
            return {
                "severity": max(0.0, min(congestion, 1.0)),
                "summary": str(payload.get("summary") or "Live port congestion signal received."),
                "source": "port_feed",
                "used_fallback": False,
            }
        except Exception:
            return stale_signal or {
                "severity": 0.31,
                "summary": "Port feed API unavailable. Using recent terminal congestion fallback.",
                "source": "fallback",
                "used_fallback": True,
            }

    return await port_cache.get_or_set(cache_key, _load)
