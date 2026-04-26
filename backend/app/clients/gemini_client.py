from __future__ import annotations

import json
import re

import httpx

from ..config import settings
from ..privacy import anonymize_payload
from .http_helpers import with_retries


def build_analyze_prompt(origin: str = "Coimbatore", destination: str = "Surat") -> str:
    return f"""You are ClearPath, an AI supply chain assistant for Indian SMBs.
A shipment from {origin} to {destination} has been flagged HIGH RISK.
Reason: Heavy rainfall forecast on the primary highway route for the next 18 hours, 85% probability of 6+ hour delay. Freight terminal congestion at {destination} adding 4 hour wait time.
Available alternate routes: NH-48 equivalent (saves 11hrs, costs ₹800 extra, 94% reliability), secondary route (saves 6hrs, costs ₹400 extra, 78% reliability).
Give a clear 3-4 sentence risk assessment and route recommendation for the SMB owner. Be specific — mention {origin}, {destination}, the time saved, and the cost. Use a helpful, direct tone. No bullet points or headers — plain paragraph only."""


def _extract_json_object(raw_text: str) -> dict:
    """Extract the first JSON object from a Gemini text response."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


async def generate_explanation(prompt_payload: dict, fallback: dict) -> dict:
    """Generate a structured explanation with a resilient JSON fallback path."""
    if not settings.gemini_api_key:
        return fallback

    url = f"{settings.gemini_base_url}/{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    safe_prompt_payload = anonymize_payload(prompt_payload)
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await with_retries(lambda: client.post(url, json=safe_prompt_payload))
            data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]  # type: ignore[index]
        parsed = _extract_json_object(text)
        return parsed
    except Exception:
        return fallback


async def generate_plain_text_recommendation(prompt: str, fallback_text: str) -> str:
    """Generate a plain-text Gemini recommendation with a resilient fallback."""
    if not settings.gemini_api_key:
        return fallback_text

    url = f"{settings.gemini_base_url}/{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await with_retries(lambda: client.post(url, json=payload))
            data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]  # type: ignore[index]
        cleaned = str(text).strip()
        return cleaned or fallback_text
    except Exception:
        return fallback_text
