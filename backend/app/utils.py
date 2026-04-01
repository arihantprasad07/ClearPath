from __future__ import annotations

import math

from .schemas import Location


def clamp(value: float, minimum: float, maximum: float) -> float:
    return min(max(value, minimum), maximum)


def haversine_km(start: Location, end: Location) -> float:
    start_lat = math.radians(start.lat)
    start_lng = math.radians(start.lng)
    end_lat = math.radians(end.lat)
    end_lng = math.radians(end.lng)
    delta_lat = end_lat - start_lat
    delta_lng = end_lng - start_lng
    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(start_lat) * math.cos(end_lat) * math.sin(delta_lng / 2) ** 2
    )
    return 6371.0 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def decode_polyline(encoded: str) -> list[Location]:
    if not encoded:
        return []

    coordinates: list[Location] = []
    index = lat = lng = 0
    length = len(encoded)

    while index < length:
        for coord_name in ("lat", "lng"):
            shift = result = 0
            while True:
                byte = ord(encoded[index]) - 63
                index += 1
                result |= (byte & 0x1F) << shift
                shift += 5
                if byte < 0x20:
                    break
            delta = ~(result >> 1) if result & 1 else result >> 1
            if coord_name == "lat":
                lat += delta
            else:
                lng += delta

        coordinates.append(Location(lat=lat / 1e5, lng=lng / 1e5))

    if len(coordinates) <= 10:
        return coordinates

    step = max(1, len(coordinates) // 8)
    sampled = coordinates[::step]
    if sampled[-1] != coordinates[-1]:
        sampled.append(coordinates[-1])
    return sampled


def format_delay(hours: float) -> str:
    total_minutes = int(round(hours * 60))
    h = total_minutes // 60
    m = total_minutes % 60
    if h and m:
        return f"{h}h {m:02d}m"
    if h:
        return f"{h}h"
    return f"{m}m"
