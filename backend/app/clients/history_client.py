from __future__ import annotations

import hashlib
from typing import Any

import httpx

from ..cache import TTLCache
from ..config import settings
from ..storage import shipment_store
from .bigquery_client import _load_access_token
from .http_helpers import with_retries

history_cache: TTLCache[dict[str, Any]] = TTLCache(300)


def _history_cache_key(corridor_key: str) -> str:
    return hashlib.sha256(corridor_key.encode("utf-8")).hexdigest()


def _normalize_corridor_key(value: str) -> str:
    return value.strip().lower()


def _shipment_corridor_key(shipment_id: str) -> str | None:
    shipment = shipment_store.get_shipment(shipment_id)
    if shipment is None:
        return None
    return _normalize_corridor_key(f"{shipment.source_query}:{shipment.destination_query}")


async def fetch_history_signal(corridor_key: str) -> dict[str, Any]:
    normalized_corridor_key = _normalize_corridor_key(corridor_key)
    cache_key = _history_cache_key(normalized_corridor_key)
    stale_signal = history_cache.get_stale(cache_key)

    async def _load() -> dict[str, Any]:
        if settings.bigquery_dataset and settings.bigquery_table:
            result = await _fetch_bigquery_history(normalized_corridor_key)
            if result is not None:
                return result

        local_events = shipment_store.list_audit_events()
        corridor_events = []
        for event in local_events:
            metadata_corridor = event.metadata.get("corridorKey")
            if isinstance(metadata_corridor, str) and _normalize_corridor_key(metadata_corridor) == normalized_corridor_key:
                corridor_events.append(event)
                continue
            if event.shipment_id and _shipment_corridor_key(event.shipment_id) == normalized_corridor_key:
                corridor_events.append(event)
        risk_events = [event for event in corridor_events if event.event_type in {"shipment_monitored", "route_approved"}]
        severity = min(0.85, 0.18 + len(risk_events) * 0.04)
        return stale_signal or {
            "severity": round(severity, 2),
            "summary": "Historical signal derived from local disruption and reroute events.",
            "source": "local_audit_log",
            "used_fallback": True,
        }

    return await history_cache.get_or_set(cache_key, _load)


async def _fetch_bigquery_history(corridor_key: str) -> dict[str, Any] | None:
    project_id = settings.bigquery_project_id or settings.firebase_project_id
    if not project_id or not settings.bigquery_dataset or not settings.bigquery_table:
        return None

    token = _load_access_token()
    if not token:
        return None

    query = (
        f"SELECT COUNT(1) AS total_events FROM `{project_id}.{settings.bigquery_dataset}.{settings.bigquery_table}` "
        "WHERE eventType IN ('shipment_monitored', 'route_approved')"
    )
    url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{project_id}/queries"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {"query": query, "useLegacySql": False}

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await with_retries(lambda: client.post(url, headers=headers, json=payload))
        rows = response.json().get("rows") or []
        total_events = int(rows[0]["f"][0]["v"]) if rows else 0
        severity = min(0.92, 0.16 + total_events * 0.03)
        return {
            "severity": round(severity, 2),
            "summary": "Historical signal derived from BigQuery operational event history.",
            "source": "bigquery",
            "used_fallback": False,
        }
    except Exception:
        return None
