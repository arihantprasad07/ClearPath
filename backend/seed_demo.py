from __future__ import annotations

import os
from datetime import UTC, datetime

os.environ.setdefault("JWT_SECRET_KEY", "clearpath-demo-secret")
os.environ.setdefault("ADMIN_PASSWORD", "ClearPathDemo123")

from app.clients.geocoding_client import LOCAL_GAZETTEER
from app.schemas import (
    AlertPayload,
    ArchitectureStatusPayload,
    CascadeImpact,
    DecisionPayload,
    DelayPayload,
    ExplanationPayload,
    PredictionWindow,
    RiskPayload,
    RiskReason,
    RoutesPayload,
    RouteOption,
    ShipmentRecord,
)
from app.storage import shipment_store


def _build_route(
    *,
    route_id: str,
    name: str,
    description: str,
    eta: float,
    distance_km: float,
    cost: float,
    reliability: float,
    risk_score: int,
    value_score: int,
    trade_off: str,
    source_key: str,
    destination_key: str,
    recommended: bool,
) -> RouteOption:
    """Create a route option for seeded demo shipments."""
    return RouteOption(
        id=route_id,
        name=name,
        description=description,
        eta=eta,
        distanceKm=distance_km,
        traffic=0.45,
        congestionIndex=0.48,
        cost=cost,
        reliability=reliability,
        riskScore=risk_score,
        weatherSeverity=0.42,
        waypoints=[LOCAL_GAZETTEER[source_key], LOCAL_GAZETTEER[destination_key]],
        timeSavedMinutes=35 if recommended else 10,
        decisionFit="Best balance of speed and reliability",
        valueScore=value_score,
        recommendedFlag=recommended,
        tradeOff=trade_off,
    )


def _seed_shipment(
    *,
    shipment_id: str,
    source_key: str,
    destination_key: str,
    priority: str,
    cargo_type: str,
    weight_kg: float,
    estimated_cargo_value: float,
    risk_score: int,
    risk_level: str,
    alert_message: str,
    explanation: ExplanationPayload,
    routes_payload: RoutesPayload,
) -> ShipmentRecord:
    """Create a fully populated shipment record for demo mode."""
    now = datetime.now(UTC).isoformat()
    source = LOCAL_GAZETTEER[source_key]
    destination = LOCAL_GAZETTEER[destination_key]
    recommended = routes_payload.options[routes_payload.recommended_route_id]

    return ShipmentRecord(
        id=shipment_id,
        orgId="default-org",
        sourceQuery=source.label or source_key.title(),
        destinationQuery=destination.label or destination_key.title(),
        source=source,
        destination=destination,
        priority=priority,
        estimatedCargoValue=estimated_cargo_value,
        cargoType=cargo_type,
        weightKg=weight_kg,
        route=routes_payload.recommended_route_id,
        riskScore=risk_score,
        status="risk_detected" if risk_score >= 60 else "stable",
        activeRouteId=routes_payload.recommended_route_id,
        selectedRouteId=routes_payload.recommended_route_id,
        recommendedRouteId=routes_payload.recommended_route_id,
        recommendedRoute=recommended.name,
        routes=routes_payload,
        risk=RiskPayload(
            score=risk_score,
            level=risk_level,
            weatherSeverity=0.68 if risk_score >= 70 else 0.34,
            trafficCongestion=0.58 if risk_score >= 60 else 0.26,
            congestionIndex=0.61 if risk_score >= 60 else 0.29,
            historicalPatternScore=0.66 if risk_score >= 60 else 0.24,
            routeLengthKm=recommended.distance_km,
            reasons=[
                RiskReason(type="weather", icon="WX", description="Weather pressure is elevated on the corridor", impact="Monsoon-sensitive lane"),
                RiskReason(type="traffic", icon="MAP", description="Traffic density is raising the delay probability", impact="Peak-hour corridor load"),
                RiskReason(type="history", icon="AI", description="Historical slowdowns match current conditions", impact="Recurring lane pattern"),
            ],
        ),
        prediction="Predicted disruption window: next 18-24 hours",
        delayEstimateHours=3.2 if risk_score >= 70 else 1.6 if risk_score >= 50 else 0.8,
        predictionWindow=PredictionWindow(startHours=18, endHours=24, confidence=78 if risk_score >= 70 else 62, label="Predicted disruption window: next 18-24 hours"),
        delay=DelayPayload(hours=3.2 if risk_score >= 70 else 1.6 if risk_score >= 50 else 0.8, text="3h 12m" if risk_score >= 70 else "1h 36m" if risk_score >= 50 else "48m", probability=0.82 if risk_score >= 70 else 0.61 if risk_score >= 50 else 0.34),
        cascadeImpact=CascadeImpact(
            severity="high" if risk_score >= 70 else "medium" if risk_score >= 50 else "low",
            affectedOrders=8 if risk_score >= 70 else 5 if risk_score >= 50 else 3,
            slaRisk="Miss likely without reroute" if risk_score >= 70 else "Promise window at risk" if risk_score >= 50 else "Monitor closely",
            summary="Seeded demo estimate of downstream order exposure based on lane risk and cargo value.",
        ),
        decision=DecisionPayload(
            riskScore=risk_score,
            prediction="Predicted disruption window: next 18-24 hours",
            recommendedRouteId=routes_payload.recommended_route_id,
            recommendedRoute=recommended.name,
            delayEstimate="See route alternatives",
            timeSavedMinutes=recommended.time_saved_minutes,
            reason="Seeded route recommendation for the solution challenge demo.",
            whyNow="The operator can avoid delay compounding by approving the best alternative quickly.",
            urgency="act_now" if risk_score >= 70 else "review" if risk_score >= 50 else "monitor",
            confidence=78 if risk_score >= 70 else 63 if risk_score >= 50 else 41,
            recommendedAction=f"Switch to {recommended.name} now",
            canReroute=True,
            approvalLabel="Approve in 1 tap",
        ),
        alert=AlertPayload(
            channel="whatsapp",
            headline="Predictive disruption alert",
            message=alert_message,
            primaryCta="Approve in 1 tap",
            fallbackChannel="push_notification_then_sms",
            translations={
                "en": alert_message,
                "hi": alert_message,
                "gu": alert_message,
                "ta": alert_message,
            },
        ),
        recommendation=f"Switch to {recommended.name} now",
        explanation=explanation,
        aiExplanation=explanation.why,
        alertFlag=risk_score >= 60,
        activeAlert=None,
        signalStack=[],
        architectureStatus=ArchitectureStatusPayload(
            authMode="firebase_primary",
            persistenceMode="sqlite",
            analyticsMode="sqlite_audit_log",
            agentMode="local_orchestrator",
            executionMode="fastapi_worker",
            deliveryModes=["whatsapp", "dashboard_only"],
            stakeholderRoles=["Shipper", "Transporter", "Receiver", "Admin"],
        ),
        statusMessage=explanation.why,
        dispatchStatus={"status": "queued"},
        usedFallbackData=True,
        responseTimeMs=420,
        alertMessage=alert_message,
        lastMonitoredAt=now,
        createdAt=now,
        updatedAt=now,
    )


def main() -> None:
    """Seed three realistic Indian SMB shipments into the local SQLite store."""
    shipments = []

    mumbai_routes = RoutesPayload(
        recommendedRouteId="route_2",
        options={
            "route_1": _build_route(route_id="route_1", name="NH48 Direct", description="Fast expressway corridor", eta=23.8, distance_km=1412, cost=24600, reliability=68, risk_score=78, value_score=42, trade_off="Fastest but highest toll cost", source_key="mumbai", destination_key="delhi", recommended=False),
            "route_2": _build_route(route_id="route_2", name="Vadodara Diversion", description="Safer inland bypass", eta=24.4, distance_km=1460, cost=22950, reliability=84, risk_score=52, value_score=76, trade_off="Safest but adds 36 min", source_key="mumbai", destination_key="delhi", recommended=True),
            "route_3": _build_route(route_id="route_3", name="Central Freight Corridor", description="Lower toll mixed corridor", eta=25.0, distance_km=1498, cost=21800, reliability=71, risk_score=61, value_score=64, trade_off="Lower cost but slightly slower", source_key="mumbai", destination_key="delhi", recommended=False),
        },
    )
    shipments.append(
        _seed_shipment(
            shipment_id="SHP-DEMO-MUMDEL",
            source_key="mumbai",
            destination_key="delhi",
            priority="critical",
            cargo_type="Electronics",
            weight_kg=1840,
            estimated_cargo_value=1850000,
            risk_score=82,
            risk_level="critical",
            alert_message="Heavy rain and corridor congestion are building on the Mumbai to Delhi lane. Approve the Vadodara Diversion now.",
            explanation=ExplanationPayload(
                headline="Monsoon pressure and corridor congestion are likely to delay the Mumbai to Delhi shipment.",
                why="Heavy rain bands, dense traffic, and recurring historical slowdowns are stacking on the active lane. The direct expressway is still moving, but the risk profile is deteriorating faster than the alternates.",
                recommendation="Approve the Vadodara Diversion now to protect the delivery promise.",
                confidence="High",
                urgency="Act now",
                title="Monsoon pressure and corridor congestion are likely to delay the Mumbai to Delhi shipment.",
                summary="Heavy rain bands, dense traffic, and recurring historical slowdowns are stacking on the active lane. The direct expressway is still moving, but the risk profile is deteriorating faster than the alternates.",
                cause="Monsoon season uplift applied to the weather signal.",
                delayEstimate="3h 12m",
                reasoning=[],
            ),
            routes_payload=mumbai_routes,
        )
    )

    surat_routes = RoutesPayload(
        recommendedRouteId="route_2",
        options={
            "route_1": _build_route(route_id="route_1", name="Coastal Connector", description="Fast route with port exposure", eta=27.1, distance_km=1562, cost=25100, reliability=70, risk_score=63, value_score=58, trade_off="Fastest but exposed to port congestion", source_key="surat", destination_key="chennai", recommended=False),
            "route_2": _build_route(route_id="route_2", name="Bengaluru Relay", description="Balanced inland relay corridor", eta=27.8, distance_km=1614, cost=23800, reliability=82, risk_score=48, value_score=74, trade_off="Balanced route with moderate extra drive time", source_key="surat", destination_key="chennai", recommended=True),
            "route_3": _build_route(route_id="route_3", name="Interior Savings Route", description="Lower-cost inland option", eta=28.6, distance_km=1655, cost=22600, reliability=76, risk_score=54, value_score=69, trade_off="Cheapest but adds 48 min", source_key="surat", destination_key="chennai", recommended=False),
        },
    )
    shipments.append(
        _seed_shipment(
            shipment_id="SHP-DEMO-SURCHE",
            source_key="surat",
            destination_key="chennai",
            priority="express",
            cargo_type="Textiles",
            weight_kg=2650,
            estimated_cargo_value=920000,
            risk_score=58,
            risk_level="medium",
            alert_message="Port-linked congestion is slowing the Surat to Chennai lane. The Bengaluru Relay is the cleanest fallback.",
            explanation=ExplanationPayload(
                headline="Port-linked congestion is raising delay risk on the Surat to Chennai shipment.",
                why="Port pressure and traffic density are pushing the direct lane into a less reliable operating window. The inland relay avoids the most exposed choke points while keeping ETA reasonably close.",
                recommendation="Monitor closely and move to the Bengaluru Relay if the active lane slips further.",
                confidence="Medium",
                urgency="Monitor",
                title="Port-linked congestion is raising delay risk on the Surat to Chennai shipment.",
                summary="Port pressure and traffic density are pushing the direct lane into a less reliable operating window. The inland relay avoids the most exposed choke points while keeping ETA reasonably close.",
                cause="Port congestion signal is elevated.",
                delayEstimate="1h 36m",
                reasoning=[],
            ),
            routes_payload=surat_routes,
        )
    )

    pune_routes = RoutesPayload(
        recommendedRouteId="route_1",
        options={
            "route_1": _build_route(route_id="route_1", name="Nagpur Mainline", description="Primary stable corridor", eta=25.3, distance_km=1868, cost=24400, reliability=89, risk_score=24, value_score=82, trade_off="Best overall balance with low disruption risk", source_key="pune", destination_key="kolkata", recommended=True),
            "route_2": _build_route(route_id="route_2", name="Raipur Alternate", description="Backup central corridor", eta=26.1, distance_km=1915, cost=23650, reliability=84, risk_score=31, value_score=76, trade_off="Low risk with a 48 min detour", source_key="pune", destination_key="kolkata", recommended=False),
            "route_3": _build_route(route_id="route_3", name="Eastern Savings Route", description="Cost-first corridor", eta=26.8, distance_km=1948, cost=22800, reliability=79, risk_score=38, value_score=72, trade_off="Cheapest but slightly slower", source_key="pune", destination_key="kolkata", recommended=False),
        },
    )
    shipments.append(
        _seed_shipment(
            shipment_id="SHP-DEMO-PUNKOL",
            source_key="pune",
            destination_key="kolkata",
            priority="standard",
            cargo_type="Auto Parts",
            weight_kg=3120,
            estimated_cargo_value=640000,
            risk_score=29,
            risk_level="low",
            alert_message="The Pune to Kolkata lane is stable. Keep the Nagpur Mainline as the active route.",
            explanation=ExplanationPayload(
                headline="The Pune to Kolkata shipment is currently moving on a stable corridor.",
                why="Weather, road, and history signals are all relatively calm on this lane. The primary route remains the best value and does not need intervention right now.",
                recommendation="Keep the Nagpur Mainline active and continue normal monitoring.",
                confidence="High",
                urgency="Low priority",
                title="The Pune to Kolkata shipment is currently moving on a stable corridor.",
                summary="Weather, road, and history signals are all relatively calm on this lane. The primary route remains the best value and does not need intervention right now.",
                cause="No major disruption indicators detected.",
                delayEstimate="48m",
                reasoning=[],
            ),
            routes_payload=pune_routes,
        )
    )

    for shipment in shipments:
        shipment_store.save_shipment(shipment)

    print(f"Seeded {len(shipments)} demo shipments into {shipment_store.sqlite_path}")


if __name__ == "__main__":
    main()
