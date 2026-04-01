from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from ..clients.geocoding_client import geocode_location
from ..config import settings
from ..schemas import AlertRecord, AnalyzeRequest, AuthUser, ShipmentAlert, ShipmentCreateRequest, ShipmentRecord, ShipmentRouteUpdateRequest
from ..storage import shipment_store
from .analyze_service import analyze_route_pair
from .event_service import record_operational_event


def _is_alert_active(risk_score: int) -> bool:
    return risk_score >= settings.risk_alert_threshold


def _build_shipment_alert(record: ShipmentRecord, timestamp: str) -> ShipmentAlert:
    return ShipmentAlert(
        message=record.alert.message,
        severity=record.risk.level,
        timestamp=timestamp,
    )


def _derive_status(record: ShipmentRecord, previous_record: ShipmentRecord | None = None) -> ShipmentRecord:
    is_risky = _is_alert_active(record.risk.score)
    status = "risk_detected" if is_risky else "stable"
    crossed_threshold = previous_record is not None and not _is_alert_active(previous_record.risk.score) and is_risky
    alert_message = record.alert.message if is_risky else None
    timestamp = record.last_monitored_at or record.updated_at
    active_alert = _build_shipment_alert(record, timestamp) if is_risky else None
    return record.model_copy(
        update={
            "route": record.active_route_id,
            "risk_score": record.risk.score,
            "status": status,
            "alert_flag": is_risky or crossed_threshold,
            "active_alert": active_alert,
            "alert_message": alert_message,
        }
    )


def _resolve_selected_route_id(current: ShipmentRecord, next_options: dict[str, object], fallback_route_id: str) -> str:
    if current.selected_route_id in next_options:
        return current.selected_route_id
    if current.active_route_id in next_options:
        return current.active_route_id
    return fallback_route_id


def _corridor_key(source_query: str, destination_query: str) -> str:
    return f"{source_query}:{destination_query}".strip().lower()


def _is_admin(user: AuthUser | None) -> bool:
    return bool(user and user.role == "admin")


def _authorize_shipment_access(shipment: ShipmentRecord, current_user: AuthUser | None) -> ShipmentRecord:
    if current_user is None or _is_admin(current_user) or shipment.org_id == current_user.org_id:
        return shipment
    raise ValueError("Shipment not found.")


async def list_shipments(current_user: AuthUser | None = None) -> list[ShipmentRecord]:
    shipments = shipment_store.list_shipments()
    if current_user is None or _is_admin(current_user):
        return shipments
    return [shipment for shipment in shipments if shipment.org_id == current_user.org_id]


async def get_shipment(shipment_id: str, current_user: AuthUser | None = None) -> ShipmentRecord:
    shipment = shipment_store.get_shipment(shipment_id)
    if shipment is None:
        raise ValueError("Shipment not found.")
    return _authorize_shipment_access(shipment, current_user)


async def create_shipment(request: ShipmentCreateRequest, current_user: AuthUser | None = None) -> ShipmentRecord:
    source = await geocode_location(request.source_query)
    destination = await geocode_location(request.destination_query)
    analysis = await analyze_route_pair(AnalyzeRequest(source=source, destination=destination, active_route_id="primary"))
    now = datetime.now(UTC).isoformat()
    org_id = current_user.org_id if current_user else "default-org"

    shipment = ShipmentRecord(
        id=f"SHP-{uuid4().hex[:8].upper()}",
        orgId=org_id,
        sourceQuery=request.source_query,
        destinationQuery=request.destination_query,
        source=source,
        destination=destination,
        route=analysis.active_route_id,
        riskScore=analysis.risk.score,
        status="monitoring",
        activeRouteId=analysis.active_route_id,
        selectedRouteId=analysis.routes.recommended_route_id,
        recommendedRouteId=analysis.decision.recommended_route_id,
        recommendedRoute=analysis.decision.recommended_route,
        routes=analysis.routes,
        risk=analysis.risk,
        prediction=analysis.prediction,
        delayEstimateHours=analysis.delay_estimate_hours,
        predictionWindow=analysis.prediction_window,
        delay=analysis.delay,
        cascadeImpact=analysis.cascade_impact,
        decision=analysis.decision,
        alert=analysis.alert,
        recommendation=analysis.recommendation,
        explanation=analysis.explanation,
        aiExplanation=analysis.ai_explanation,
        alertFlag=False,
        activeAlert=None,
        signalStack=analysis.signal_stack,
        architectureStatus=analysis.architecture_status,
        statusMessage=analysis.status_message,
        dispatchStatus=analysis.dispatch_status,
        usedFallbackData=analysis.used_fallback_data,
        responseTimeMs=analysis.response_time_ms,
        alertMessage=None,
        lastMonitoredAt=now,
        createdAt=now,
        updatedAt=now,
    )
    shipment = _derive_status(shipment)
    saved = shipment_store.save_shipment(shipment)
    await record_operational_event(
        event_type="shipment_created",
        status=saved.status,
        actor="operator",
        org_id=saved.org_id,
        detail=f"Created lane from {saved.source.label} to {saved.destination.label}.",
        shipment_id=saved.id,
        metadata={
            "riskScore": saved.risk.score,
            "recommendedRouteId": saved.recommended_route_id,
            "dispatchStatus": saved.dispatch_status or {},
            "usedFallbackData": saved.used_fallback_data,
            "corridorKey": _corridor_key(saved.source_query, saved.destination_query),
        },
    )
    return saved


async def refresh_shipment(shipment_id: str, *, monitored: bool = False, current_user: AuthUser | None = None) -> ShipmentRecord:
    current = await get_shipment(shipment_id, current_user)

    analysis = await analyze_route_pair(
        AnalyzeRequest(source=current.source, destination=current.destination, active_route_id=current.active_route_id)
    )
    monitored_at = datetime.now(UTC).isoformat()
    updated = current.model_copy(
        update={
            "routes": analysis.routes,
            "risk": analysis.risk,
            "prediction": analysis.prediction,
            "delay_estimate_hours": analysis.delay_estimate_hours,
            "prediction_window": analysis.prediction_window,
            "delay": analysis.delay,
            "cascade_impact": analysis.cascade_impact,
            "decision": analysis.decision,
            "alert": analysis.alert,
            "recommendation": analysis.recommendation,
            "explanation": analysis.explanation,
            "ai_explanation": analysis.ai_explanation,
            "signal_stack": analysis.signal_stack,
            "architecture_status": analysis.architecture_status,
            "status_message": analysis.status_message,
            "dispatch_status": analysis.dispatch_status,
            "used_fallback_data": analysis.used_fallback_data,
            "response_time_ms": analysis.response_time_ms,
            "selected_route_id": _resolve_selected_route_id(
                current,
                analysis.routes.options,
                analysis.routes.recommended_route_id,
            ),
            "recommended_route_id": analysis.decision.recommended_route_id,
            "recommended_route": analysis.decision.recommended_route,
            "last_monitored_at": monitored_at,
            "updated_at": monitored_at,
        }
    )
    updated = _derive_status(updated, previous_record=current)
    if monitored and updated.alert_flag and not current.alert_flag:
        shipment_store.save_alert(
            AlertRecord(
                id=f"ALT-{uuid4().hex[:12].upper()}",
                orgId=updated.org_id,
                shipmentId=updated.id,
                severity=updated.risk.level,
                message=updated.alert.message,
                createdAt=monitored_at,
                status="open",
            )
        )
        updated = updated.model_copy(
            update={
                "status_message": (
                    f"Monitoring detected risk above the alert threshold ({settings.risk_alert_threshold}). "
                    "Shipment status and alert flag were updated automatically."
                )
            }
        )
    saved = shipment_store.save_shipment(updated)
    await record_operational_event(
        event_type="shipment_monitored" if monitored else "shipment_refreshed",
        status=saved.status,
        actor="monitor" if monitored else "operator",
        org_id=saved.org_id,
        detail=(
            "Automatic monitoring cycle completed."
            if monitored
            else f"Manual refresh completed for {saved.id}."
        ),
        shipment_id=saved.id,
        metadata={
            "riskScore": saved.risk.score,
            "alertFlag": saved.alert_flag,
            "dispatchStatus": saved.dispatch_status or {},
            "usedFallbackData": saved.used_fallback_data,
            "corridorKey": _corridor_key(saved.source_query, saved.destination_query),
        },
    )
    return saved


async def apply_route(shipment_id: str, request: ShipmentRouteUpdateRequest, current_user: AuthUser | None = None) -> ShipmentRecord:
    current = await get_shipment(shipment_id, current_user)

    if request.route_id not in current.routes.options:
        raise ValueError("Route not found for shipment.")

    updated = current.model_copy(
        update={
            "active_route_id": request.route_id,
            "selected_route_id": request.route_id,
            "updated_at": datetime.now(UTC).isoformat(),
            "status": "monitoring",
            "alert_flag": False,
            "active_alert": None,
            "alert_message": None,
            "route": request.route_id,
        }
    )
    shipment_store.save_shipment(updated)
    refreshed = await refresh_shipment(shipment_id, current_user=current_user)
    await record_operational_event(
        event_type="route_approved",
        status=refreshed.status,
        actor="operator",
        org_id=refreshed.org_id,
        detail=f"Approved route {request.route_id} for shipment {shipment_id}.",
        shipment_id=refreshed.id,
        metadata={
            "activeRouteId": refreshed.active_route_id,
            "recommendedRouteId": refreshed.recommended_route_id,
            "riskScore": refreshed.risk.score,
            "corridorKey": _corridor_key(refreshed.source_query, refreshed.destination_query),
        },
    )
    return refreshed
