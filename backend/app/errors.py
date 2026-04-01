from __future__ import annotations

import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .logging_config import log_event

logger = logging.getLogger("clearpath.api")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        started_at = time.perf_counter()
        request_id = request.headers.get("X-Request-ID") or f"req_{uuid4().hex[:12]}"
        request.state.request_id = request_id
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = int((time.perf_counter() - started_at) * 1000)
            log_event(
                logger,
                logging.ERROR,
                "Unhandled request failure",
                requestId=request_id,
                method=request.method,
                path=request.url.path,
                clientIp=request.client.host if request.client else None,
                durationMs=duration_ms,
            )
            raise

        duration_ms = int((time.perf_counter() - started_at) * 1000)
        response.headers.setdefault("X-Request-ID", request_id)
        log_event(
            logger,
            logging.INFO,
            "Request completed",
            requestId=request_id,
            method=request.method,
            path=request.url.path,
            statusCode=response.status_code,
            clientIp=request.client.host if request.client else None,
            durationMs=duration_ms,
        )
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-origin")
        return response


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", f"req_{uuid4().hex[:12]}")
        log_event(
            logger,
            logging.ERROR,
            "Unhandled application error",
            requestId=request_id,
            path=request.url.path,
            error=str(exc),
        )
        return JSONResponse(
            status_code=500,
            headers={"X-Request-ID": request_id},
            content={"detail": "Internal server error.", "requestId": request_id},
        )
