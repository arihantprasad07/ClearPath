from __future__ import annotations

import hashlib
import re
from collections.abc import Mapping
from typing import Any


_EMAIL_PATTERN = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
_PHONE_PATTERN = re.compile(r"(?<!\d)(?:\+?\d[\d\s-]{8,}\d)(?!\d)")


def hash_value(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode("utf-8")).hexdigest()[:16]


def anonymize_text(value: str) -> str:
    scrubbed = _EMAIL_PATTERN.sub("[email]", value)
    scrubbed = _PHONE_PATTERN.sub("[phone]", scrubbed)
    return scrubbed


def anonymize_label(label: str | None) -> str | None:
    if not label:
        return label
    normalized = label.strip()
    return f"loc_{hash_value(normalized)}"


def anonymize_payload(payload: Any) -> Any:
    if isinstance(payload, str):
        return anonymize_text(payload)
    if isinstance(payload, Mapping):
        sanitized: dict[str, Any] = {}
        for key, value in payload.items():
            lowered = str(key).lower()
            if lowered in {"detail", "message", "summary", "source", "destination"} and isinstance(value, str):
                sanitized[str(key)] = anonymize_text(value)
            elif lowered in {"shipmentid", "shipment_id", "userid", "user_id", "corridorkey", "corridor_key"} and value is not None:
                sanitized[str(key)] = hash_value(str(value))
            else:
                sanitized[str(key)] = anonymize_payload(value)
        return sanitized
    if isinstance(payload, list):
        return [anonymize_payload(item) for item in payload]
    return payload
