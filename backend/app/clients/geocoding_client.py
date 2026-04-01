from __future__ import annotations

from typing import Any

import httpx

from ..cache import TTLCache
from .http_helpers import with_retries
from ..config import settings
from ..schemas import Location

geocode_cache: TTLCache[Location] = TTLCache(1800)

LOCAL_GAZETTEER: dict[str, Location] = {
    "mumbai": Location(lat=19.0760, lng=72.8777, label="Mumbai, Maharashtra, India"),
    "mumbai maharashtra": Location(lat=19.0760, lng=72.8777, label="Mumbai, Maharashtra, India"),
    "delhi": Location(lat=28.6139, lng=77.2090, label="Delhi, India"),
    "new delhi": Location(lat=28.6139, lng=77.2090, label="Delhi, India"),
    "bengaluru": Location(lat=12.9716, lng=77.5946, label="Bengaluru, Karnataka, India"),
    "bangalore": Location(lat=12.9716, lng=77.5946, label="Bengaluru, Karnataka, India"),
    "hyderabad": Location(lat=17.3850, lng=78.4867, label="Hyderabad, Telangana, India"),
    "chennai": Location(lat=13.0827, lng=80.2707, label="Chennai, Tamil Nadu, India"),
    "kolkata": Location(lat=22.5726, lng=88.3639, label="Kolkata, West Bengal, India"),
    "pune": Location(lat=18.5204, lng=73.8567, label="Pune, Maharashtra, India"),
    "ahmedabad": Location(lat=23.0225, lng=72.5714, label="Ahmedabad, Gujarat, India"),
    "jaipur": Location(lat=26.9124, lng=75.7873, label="Jaipur, Rajasthan, India"),
    "surat": Location(lat=21.1702, lng=72.8311, label="Surat, Gujarat, India"),
    "lucknow": Location(lat=26.8467, lng=80.9462, label="Lucknow, Uttar Pradesh, India"),
    "kochi": Location(lat=9.9312, lng=76.2673, label="Kochi, Kerala, India"),
    "cochin": Location(lat=9.9312, lng=76.2673, label="Kochi, Kerala, India"),
    "nagpur": Location(lat=21.1458, lng=79.0882, label="Nagpur, Maharashtra, India"),
    "indore": Location(lat=22.7196, lng=75.8577, label="Indore, Madhya Pradesh, India"),
}


def _cache_key(query: str) -> str:
    return query.strip().lower()


def _normalize_query(query: str) -> str:
    cleaned = query.strip().lower().replace(",", " ")
    return " ".join(cleaned.split())


def _parse_coordinate_query(query: str) -> Location | None:
    match = query.strip()
    parts = [part.strip() for part in match.split(",")]
    if len(parts) != 2:
        return None
    try:
        lat = float(parts[0])
        lng = float(parts[1])
    except ValueError:
        return None
    return Location(lat=lat, lng=lng, label=f"{lat:.4f}, {lng:.4f}")


def _lookup_local_gazetteer(query: str) -> Location | None:
    normalized = _normalize_query(query)
    if normalized in LOCAL_GAZETTEER:
        return LOCAL_GAZETTEER[normalized]

    for key, value in LOCAL_GAZETTEER.items():
        if normalized.startswith(key) or key.startswith(normalized):
            return value
    return None


async def geocode_location(query: str) -> Location:
    coordinate_location = _parse_coordinate_query(query)
    if coordinate_location is not None:
        return coordinate_location

    cache_key = _cache_key(query)

    async def _load() -> Location:
        local_match = _lookup_local_gazetteer(query)
        if local_match is not None:
            return local_match

        if not settings.google_maps_api_key:
            raise ValueError(
                f"Could not find a local location match for '{query}'. Add GOOGLE_MAPS_API_KEY or use lat,lng input."
            )

        params = {
            "address": query,
            "key": settings.google_maps_api_key,
        }

        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await with_retries(lambda: client.get(settings.google_geocoding_url, params=params))
            payload: dict[str, Any] = response.json()

        results = payload.get("results") or []
        if not results:
            local_match = _lookup_local_gazetteer(query)
            if local_match is not None:
                return local_match
            raise ValueError(f"Could not find a location for '{query}'.")

        first = results[0]
        geometry = first.get("geometry") or {}
        location = geometry.get("location") or {}
        return Location(
            lat=float(location.get("lat")),
            lng=float(location.get("lng")),
            label=first.get("formatted_address") or query,
        )

    return await geocode_cache.get_or_set(cache_key, _load)
