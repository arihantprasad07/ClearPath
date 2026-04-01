from __future__ import annotations

import asyncio
from typing import Any

import httpx

from ..cache import TTLCache
from ..config import settings
from ..schemas import Location
from ..utils import clamp
from .http_helpers import with_retries

weather_cache: TTLCache[dict[str, Any]] = TTLCache(settings.weather_cache_ttl_seconds)


def _weather_cache_key(points: list[Location]) -> str:
    return "|".join(f"{point.lat:.3f}:{point.lng:.3f}" for point in points[:6])


async def fetch_weather_summary(points: list[Location]) -> dict[str, Any]:
    sampled = [points[0], points[len(points) // 2], points[-1]] if len(points) >= 3 else points
    cache_key = _weather_cache_key(sampled)
    stale_weather = weather_cache.get_stale(cache_key)

    async def _load() -> dict[str, Any]:
        if not settings.weather_api_key:
            return stale_weather or {
                "rain": 8.4,
                "severity": 0.71,
                "summary": "Heavy rainfall risk detected along the route",
                "used_fallback": True,
            }

        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            results = await asyncio.gather(
                *[_fetch_single_weather(client, point) for point in sampled],
                return_exceptions=True,
            )

        valid = [result for result in results if isinstance(result, dict)]
        if not valid:
            return stale_weather or {
                "rain": 6.2,
                "severity": 0.64,
                "summary": "Weather API unavailable. Using recent storm fallback.",
                "used_fallback": True,
            }

        avg_rain = sum(item["rain"] for item in valid) / len(valid)
        avg_severity = sum(item["severity"] for item in valid) / len(valid)
        summaries = [item["description"] for item in valid[:2]]
        return {
            "rain": round(avg_rain, 2),
            "severity": round(avg_severity, 2),
            "summary": " / ".join(summaries),
            "used_fallback": len(valid) != len(sampled),
        }

    return await weather_cache.get_or_set(cache_key, _load)


async def _fetch_single_weather(client: httpx.AsyncClient, point: Location) -> dict[str, Any]:
    params = {
        "lat": point.lat,
        "lon": point.lng,
        "appid": settings.weather_api_key,
        "units": "metric",
    }
    response = await with_retries(lambda: client.get(settings.weather_base_url, params=params))
    payload = response.json()

    rain = float((payload.get("rain") or {}).get("1h") or 0)
    wind_speed = float((payload.get("wind") or {}).get("speed") or 0)
    visibility = float(payload.get("visibility") or 10000)
    condition = (payload.get("weather") or [{}])[0].get("main", "").lower()
    description = (payload.get("weather") or [{}])[0].get("description", "weather signal")

    severity = 0.08
    if condition in {"rain", "thunderstorm", "drizzle"}:
        severity += 0.35
    if condition in {"snow", "squall", "tornado"}:
        severity += 0.45
    severity += clamp(rain / 15, 0, 0.22)
    severity += clamp(wind_speed / 50, 0, 0.15)
    severity += clamp((10000 - visibility) / 10000, 0, 0.2)

    return {
        "rain": rain,
        "severity": clamp(severity, 0, 1),
        "description": description,
    }
