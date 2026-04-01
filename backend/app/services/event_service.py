from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from ..clients.bigquery_client import export_operational_event
from ..privacy import anonymize_payload
from ..schemas import AuditEventRecord, AuthUser
from ..storage import shipment_store


async def record_operational_event(
    *,
    event_type: str,
    status: str,
    actor: str,
    detail: str,
    org_id: str = "default-org",
    shipment_id: str | None = None,
    metadata: dict[str, object] | None = None,
) -> AuditEventRecord:
    now = datetime.now(UTC).isoformat()
    event = AuditEventRecord(
        id=f"EVT-{uuid4().hex[:12].upper()}",
        orgId=org_id,
        shipmentId=shipment_id,
        eventType=event_type,
        status=status,
        actor=actor,
        detail=detail,
        metadata=metadata or {},
        createdAt=now,
        exportStatus=None,
    )
    export_status = await export_operational_event(
        {
            "id": event.id,
            "shipmentId": event.shipment_id,
            "eventType": event.event_type,
            "status": event.status,
            "actor": event.actor,
            "detail": anonymize_payload(event.detail),
            "metadata": anonymize_payload(event.metadata),
            "createdAt": event.created_at,
        }
    )
    saved_event = event.model_copy(update={"export_status": export_status})
    return shipment_store.save_audit_event(saved_event)


async def list_operational_events(shipment_id: str | None = None, current_user: AuthUser | None = None) -> list[AuditEventRecord]:
    events = shipment_store.list_audit_events(shipment_id)
    if current_user is None or current_user.role == "admin":
        return events
    return [event for event in events if event.org_id == current_user.org_id]
