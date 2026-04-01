from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable

import httpx

from ..config import settings


async def with_retries(factory: Callable[[], Awaitable[httpx.Response]]) -> httpx.Response:
    last_error: Exception | None = None
    for attempt in range(settings.request_retry_attempts + 1):
        try:
            response = await factory()
            response.raise_for_status()
            return response
        except (httpx.HTTPError, asyncio.TimeoutError) as error:
            last_error = error
            if attempt >= settings.request_retry_attempts:
                break
            await asyncio.sleep(0.2 * (attempt + 1))

    if last_error is None:
        raise RuntimeError("Request failed without an error.")
    raise last_error
