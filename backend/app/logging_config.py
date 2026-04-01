from __future__ import annotations

import json
import logging
from logging.config import dictConfig

from .config import settings


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "timestamp": self.formatTime(record, self.datefmt),
        }
        if hasattr(record, "event_data") and isinstance(record.event_data, dict):
            payload.update(record.event_data)
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=True)


def configure_logging() -> None:
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {"json": {"()": JsonFormatter}},
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                }
            },
            "root": {"handlers": ["default"], "level": settings.log_level.upper()},
        }
    )


def log_event(logger: logging.Logger, level: int, message: str, **event_data: object) -> None:
    logger.log(level, message, extra={"event_data": event_data})
