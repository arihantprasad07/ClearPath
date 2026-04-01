from __future__ import annotations

import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Generic, TypeVar


T = TypeVar("T")


@dataclass
class CacheEntry(Generic[T]):
    value: T
    expires_at: float


class TTLCache(Generic[T]):
    def __init__(self, ttl_seconds: int) -> None:
        self.ttl_seconds = ttl_seconds
        self._store: dict[str, CacheEntry[T]] = {}

    def get(self, key: str) -> T | None:
        entry = self._store.get(key)
        if not entry:
            return None
        if entry.expires_at <= time.time():
            return None
        return entry.value

    def get_stale(self, key: str) -> T | None:
        entry = self._store.get(key)
        return entry.value if entry else None

    def set(self, key: str, value: T) -> T:
        self._store[key] = CacheEntry(value=value, expires_at=time.time() + self.ttl_seconds)
        return value

    async def get_or_set(self, key: str, factory: Callable[[], Awaitable[T]]) -> T:
        cached = self.get(key)
        if cached is not None:
            return cached
        value = await factory()
        return self.set(key, value)
