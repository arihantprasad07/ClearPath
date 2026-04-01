from __future__ import annotations

from typing import Any

import httpx

from ..config import settings
from ..privacy import anonymize_payload
from .bigquery_client import _load_access_token
from .http_helpers import with_retries


async def orchestrate_disruption_workflow(context: dict[str, Any]) -> dict[str, Any]:
    if not settings.vertex_ai_project_id:
        return {
            "mode": "local_orchestrator",
            "summary": "Local workflow coordinated the detect -> score -> route -> notify pipeline.",
            "used_fallback": True,
        }

    token = _load_access_token()
    if not token:
        return {
            "mode": "local_orchestrator",
            "summary": "Vertex credentials unavailable. Local workflow coordinated the pipeline.",
            "used_fallback": True,
        }

    url = (
        f"https://{settings.vertex_ai_location}-aiplatform.googleapis.com/v1/projects/"
        f"{settings.vertex_ai_project_id}/locations/{settings.vertex_ai_location}/publishers/google/models/"
        f"{settings.vertex_ai_model}:generateContent"
    )
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            "Summarize a disruption pipeline execution in one sentence with the steps detect, score, route, notify. "
                            f"Context: {anonymize_payload(context)}"
                        )
                    }
                ],
            }
        ],
        "generationConfig": {"temperature": 0.1},
    }

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await with_retries(lambda: client.post(url, headers=headers, json=payload))
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]  # type: ignore[index]
        return {"mode": "vertex_ai", "summary": text, "used_fallback": False}
    except Exception:
        return {
            "mode": "local_orchestrator",
            "summary": "Vertex request failed. Local workflow coordinated the detect -> score -> route -> notify pipeline.",
            "used_fallback": True,
        }
