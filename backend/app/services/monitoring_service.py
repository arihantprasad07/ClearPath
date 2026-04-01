from __future__ import annotations

import asyncio
import logging

from ..config import settings
from ..logging_config import log_event
from .shipment_service import list_shipments, refresh_shipment

logger = logging.getLogger(__name__)


class ShipmentMonitor:
    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._shutdown: asyncio.Event | None = None

    async def start(self) -> None:
        if self._task and not self._task.done():
            return
        self._shutdown = asyncio.Event()
        self._shutdown.clear()
        self._task = asyncio.create_task(self._run(), name="shipment-monitor")

    async def stop(self) -> None:
        if self._shutdown is not None:
            self._shutdown.set()
        if self._task is None:
            return
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        self._task = None
        self._shutdown = None

    async def _run(self) -> None:
        if self._shutdown is None:
            return

        while not self._shutdown.is_set():
            try:
                await self.monitor_all_shipments()
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("Shipment monitor cycle failed.")

            try:
                await asyncio.wait_for(self._shutdown.wait(), timeout=settings.monitoring_interval_seconds)
            except asyncio.TimeoutError:
                continue

    async def monitor_all_shipments(self) -> None:
        shipments = await list_shipments()
        if not shipments:
            return

        results = await asyncio.gather(
            *(refresh_shipment(shipment.id, monitored=True) for shipment in shipments),
            return_exceptions=True,
        )
        for shipment, result in zip(shipments, results):
            if isinstance(result, Exception):
                logger.exception("Automatic monitoring failed for shipment %s", shipment.id, exc_info=result)
            else:
                log_event(
                    logger,
                    logging.INFO,
                    "Shipment monitored",
                    shipmentId=shipment.id,
                    status=result.status,
                    riskScore=result.risk.score,
                )


shipment_monitor = ShipmentMonitor()
