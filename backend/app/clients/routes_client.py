from __future__ import annotations

from typing import Any

import httpx

from ..cache import TTLCache
from .http_helpers import with_retries
from ..config import settings
from ..schemas import Location
from ..utils import clamp, decode_polyline, haversine_km

route_cache: TTLCache[list[dict[str, Any]]] = TTLCache(settings.route_cache_ttl_seconds)


def _route_cache_key(source: Location, destination: Location) -> str:
    return (
        f"{source.lat:.4f}:{source.lng:.4f}:{source.label or ''}"
        f"->{destination.lat:.4f}:{destination.lng:.4f}:{destination.label or ''}"
    )


async def fetch_routes(source: Location, destination: Location) -> list[dict[str, Any]]:
    cache_key = _route_cache_key(source, destination)
    stale_routes = route_cache.get_stale(cache_key)

    async def _load() -> list[dict[str, Any]]:
        if not settings.google_maps_api_key:
            return stale_routes or _fallback_routes(source, destination)

        payload = {
            "origin": {"location": {"latLng": {"latitude": source.lat, "longitude": source.lng}}},
            "destination": {
                "location": {"latLng": {"latitude": destination.lat, "longitude": destination.lng}}
            },
            "travelMode": "DRIVE",
            "computeAlternativeRoutes": True,
            "routingPreference": "TRAFFIC_AWARE",
            "languageCode": "en-US",
            "units": "METRIC",
        }
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": settings.google_maps_api_key,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        }
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                response = await with_retries(lambda: client.post(settings.google_routes_url, json=payload, headers=headers))
                data = response.json()
        except Exception:
            return stale_routes or _fallback_routes(source, destination)

        routes: list[dict[str, Any]] = []
        route_names = ["Primary Corridor", "Southern Relief", "Northern Shield"]
        descriptions = [
            "Balanced route with direct highway coverage",
            "Lower congestion corridor with fuel efficiency upside",
            "Longer route with steadier traffic conditions",
        ]

        for index, item in enumerate((data.get("routes") or [])[:3]):
            duration_seconds = float(str(item.get("duration", "0s")).replace("s", "") or 0)
            distance_km = round(float(item.get("distanceMeters", 0)) / 1000, 1)
            duration_hours = round(duration_seconds / 3600, 2)
            ideal_hours = distance_km / 68 if distance_km else duration_hours
            traffic = round(clamp(1 - (ideal_hours / duration_hours if duration_hours else 1), 0, 1), 2)
            waypoints = decode_polyline(((item.get("polyline") or {}).get("encodedPolyline") or ""))
            if not waypoints:
                waypoints = [source, destination]
            routes.append(
                {
                    "id": ["primary", "south", "north"][index],
                    "name": route_names[index],
                    "description": descriptions[index],
                    "eta": duration_hours,
                    "distance_km": distance_km,
                    "traffic": traffic,
                    "waypoints": waypoints,
                    "used_fallback": False,
                }
            )

        return routes or stale_routes or _fallback_routes(source, destination)

    return await route_cache.get_or_set(cache_key, _load)


def _fallback_routes(source: Location, destination: Location) -> list[dict[str, Any]]:
    direct_distance = haversine_km(source, destination)
    return [
        {
            "id": "primary",
            "name": "Primary Corridor",
            "description": "Balanced route with direct highway coverage",
            "eta": round(direct_distance / 68, 2),
            "distance_km": round(direct_distance * 1.18, 1),
            "traffic": 0.74,
            "used_fallback": True,
            "waypoints": [
                source,
                Location(lat=(source.lat * 0.7 + destination.lat * 0.3), lng=(source.lng * 0.7 + destination.lng * 0.3)),
                Location(lat=(source.lat * 0.3 + destination.lat * 0.7), lng=(source.lng * 0.3 + destination.lng * 0.7)),
                destination,
            ],
        },
        {
            "id": "south",
            "name": "Southern Relief",
            "description": "Lower congestion corridor with fuel efficiency upside",
            "eta": round(direct_distance / 66, 2),
            "distance_km": round(direct_distance * 1.15, 1),
            "traffic": 0.38,
            "used_fallback": True,
            "waypoints": [
                source,
                Location(lat=min(source.lat, destination.lat) - 1.5, lng=(source.lng + destination.lng) / 2),
                destination,
            ],
        },
        {
            "id": "north",
            "name": "Northern Shield",
            "description": "Longer route with steadier traffic conditions",
            "eta": round(direct_distance / 64, 2),
            "distance_km": round(direct_distance * 1.24, 1),
            "traffic": 0.46,
            "used_fallback": True,
            "waypoints": [
                source,
                Location(lat=max(source.lat, destination.lat) + 1.4, lng=(source.lng + destination.lng) / 2),
                destination,
            ],
        },
    ]
