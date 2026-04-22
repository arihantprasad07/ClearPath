from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


def validate_username(value: str) -> str:
    normalized = value.strip().lower()
    if not normalized:
        raise ValueError("Username is required.")
    allowed = set("abcdefghijklmnopqrstuvwxyz0123456789._-")
    if any(character not in allowed for character in normalized):
        raise ValueError("Username can only contain letters, numbers, dots, dashes, and underscores.")
    return normalized


def validate_password_strength(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if value.lower() == value or value.upper() == value:
        raise ValueError("Password must include both uppercase and lowercase letters.")
    if not any(character.isdigit() for character in value):
        raise ValueError("Password must include at least one number.")
    return value


class ShipmentRequest(BaseModel):
    source_query: str = Field(alias="sourceQuery")
    destination_query: str = Field(alias="destinationQuery")

    model_config = {"populate_by_name": True}


class Location(BaseModel):
    lat: float
    lng: float
    label: str | None = None


class AnalyzeRequest(BaseModel):
    source: Location
    destination: Location
    active_route_id: str | None = Field(default=None, alias="activeRouteId")
    priority: Literal["standard", "express", "critical"] = "standard"
    estimated_cargo_value: float | None = Field(default=None, alias="estimatedCargoValue")


class GeocodeRequest(BaseModel):
    query: str = Field(min_length=2)


class RiskReason(BaseModel):
    type: str
    icon: str
    description: str
    impact: str


class RiskPayload(BaseModel):
    score: int
    level: Literal["low", "medium", "high", "critical"]
    weather_severity: float = Field(alias="weatherSeverity")
    traffic_congestion: float = Field(alias="trafficCongestion")
    congestion_index: float = Field(alias="congestionIndex")
    historical_pattern_score: float = Field(alias="historicalPatternScore")
    route_length_km: float = Field(alias="routeLengthKm")
    reasons: list[RiskReason]


class PredictionWindow(BaseModel):
    start_hours: int = Field(alias="startHours")
    end_hours: int = Field(alias="endHours")
    confidence: int
    label: str


class DelayPayload(BaseModel):
    hours: float
    text: str
    probability: float


class RouteOption(BaseModel):
    id: str
    name: str
    description: str
    eta: float
    distance_km: float = Field(alias="distanceKm")
    traffic: float
    congestion_index: float = Field(alias="congestionIndex")
    cost: float
    reliability: float
    risk_score: int = Field(alias="riskScore")
    weather_severity: float = Field(alias="weatherSeverity")
    waypoints: list[Location]
    time_saved_minutes: int = Field(alias="timeSavedMinutes")
    decision_fit: str = Field(alias="decisionFit")
    value_score: int = Field(default=0, alias="valueScore")
    recommended_flag: bool = Field(default=False, alias="recommendedFlag")
    trade_off: str = Field(default="", alias="tradeOff")


class RoutesPayload(BaseModel):
    recommended_route_id: str = Field(alias="recommendedRouteId")
    options: dict[str, RouteOption]


class CascadeImpact(BaseModel):
    severity: Literal["low", "medium", "high"]
    affected_orders: int = Field(alias="affectedOrders")
    sla_risk: str = Field(alias="slaRisk")
    summary: str


class SignalSourcePayload(BaseModel):
    name: str
    summary: str
    severity: float
    source: str
    used_fallback: bool = Field(alias="usedFallback")


class ArchitectureStatusPayload(BaseModel):
    auth_mode: str = Field(alias="authMode")
    persistence_mode: str = Field(alias="persistenceMode")
    analytics_mode: str = Field(alias="analyticsMode")
    agent_mode: str = Field(alias="agentMode")
    execution_mode: str = Field(alias="executionMode")
    delivery_modes: list[str] = Field(alias="deliveryModes")
    stakeholder_roles: list[str] = Field(alias="stakeholderRoles")


class DecisionPayload(BaseModel):
    risk_score: int = Field(default=0, alias="riskScore")
    prediction: str = ""
    recommended_route_id: str = Field(alias="recommendedRouteId")
    recommended_route: str = Field(default="", alias="recommendedRoute")
    delay_estimate: str = Field(default="", alias="delayEstimate")
    time_saved_minutes: int = Field(default=0, alias="timeSavedMinutes")
    reason: str = ""
    why_now: str = Field(default="", alias="whyNow")
    urgency: Literal["monitor", "review", "act_now"] = "review"
    confidence: int = 0
    recommended_action: str = Field(default="", alias="recommendedAction")
    can_reroute: bool = Field(default=True, alias="canReroute")
    approval_label: str = Field(default="Approve", alias="approvalLabel")


class AlertPayload(BaseModel):
    channel: Literal["whatsapp"]
    headline: str
    message: str
    primary_cta: str = Field(alias="primaryCta")
    fallback_channel: str = Field(alias="fallbackChannel")
    translations: dict[str, str]


class ShipmentAlert(BaseModel):
    message: str
    severity: Literal["low", "medium", "high", "critical"]
    timestamp: str


class ExplanationPayload(BaseModel):
    headline: str = ""
    why: str = ""
    recommendation: str = ""
    confidence: str = "Medium"
    urgency: Literal["Act now", "Monitor", "Low priority"] = "Monitor"
    title: str = ""
    summary: str = ""
    cause: str = ""
    delay_estimate: str = Field(default="", alias="delayEstimate")
    reasoning: list[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def populate_legacy_and_structured_fields(cls, value: object) -> object:
        if not isinstance(value, dict):
            return value
        payload = dict(value)
        headline = str(payload.get("headline") or payload.get("title") or "").strip()
        why = str(payload.get("why") or payload.get("summary") or payload.get("cause") or "").strip()
        recommendation = str(payload.get("recommendation") or "").strip()
        confidence = str(payload.get("confidence") or "Medium").strip() or "Medium"
        urgency = str(payload.get("urgency") or "Monitor").strip() or "Monitor"
        payload["headline"] = headline
        payload["why"] = why
        payload["recommendation"] = recommendation
        payload["confidence"] = confidence
        payload["urgency"] = urgency
        payload["title"] = str(payload.get("title") or headline).strip()
        payload["summary"] = str(payload.get("summary") or why).strip()
        payload["cause"] = str(payload.get("cause") or why).strip()
        if not payload.get("reasoning"):
            reasoning = [segment.strip() for segment in [headline, why, recommendation] if segment and segment.strip()]
            payload["reasoning"] = reasoning
        return payload


class ShipmentSummaryPayload(BaseModel):
    source: str
    destination: str
    active_route_id: str = Field(alias="activeRouteId")
    status: str


class AnalyzeResponse(BaseModel):
    shipment: ShipmentSummaryPayload
    risk: RiskPayload
    prediction: str
    delay_estimate_hours: float = Field(alias="delayEstimateHours")
    prediction_window: PredictionWindow = Field(alias="predictionWindow")
    delay: DelayPayload
    cascade_impact: CascadeImpact = Field(alias="cascadeImpact")
    decision: DecisionPayload
    alert: AlertPayload
    routes: RoutesPayload
    recommendation: str
    explanation: ExplanationPayload
    ai_explanation: str = Field(alias="aiExplanation")
    source: str
    destination: str
    signal_stack: list[SignalSourcePayload] = Field(alias="signalStack")
    architecture_status: ArchitectureStatusPayload = Field(alias="architectureStatus")
    status_message: str = Field(alias="statusMessage")
    dispatch_status: dict[str, str] | None = Field(default=None, alias="dispatchStatus")
    used_fallback_data: bool = Field(alias="usedFallbackData")
    response_time_ms: int = Field(alias="responseTimeMs")
    active_route_id: str = Field(alias="activeRouteId")


class ShipmentCreateRequest(BaseModel):
    source_query: str = Field(alias="sourceQuery", min_length=2)
    destination_query: str = Field(alias="destinationQuery", min_length=2)
    priority: Literal["standard", "express", "critical"] = "standard"
    estimated_cargo_value: float | None = Field(default=None, alias="estimatedCargoValue", ge=0)

    model_config = {"populate_by_name": True}

    @model_validator(mode="before")
    @classmethod
    def populate_legacy_fields(cls, value: object) -> object:
        if not isinstance(value, dict):
            return value
        payload = dict(value)
        if "sourceQuery" not in payload and "source" in payload:
            payload["sourceQuery"] = payload["source"]
        if "destinationQuery" not in payload and "destination" in payload:
            payload["destinationQuery"] = payload["destination"]
        return payload


class ShipmentRouteUpdateRequest(BaseModel):
    route_id: str = Field(alias="routeId", min_length=2)

    model_config = {"populate_by_name": True}

    @model_validator(mode="before")
    @classmethod
    def populate_route_id(cls, value: object) -> object:
        if not isinstance(value, dict):
            return value
        payload = dict(value)
        if "routeId" not in payload and "route" in payload:
            payload["routeId"] = payload["route"]
        return payload


class ShipmentRecord(BaseModel):
    id: str
    org_id: str = Field(default="default-org", alias="orgId")
    source_query: str = Field(alias="sourceQuery")
    destination_query: str = Field(alias="destinationQuery")
    source: Location
    destination: Location
    priority: Literal["standard", "express", "critical"] = "standard"
    estimated_cargo_value: float | None = Field(default=None, alias="estimatedCargoValue")
    cargo_type: str | None = Field(default=None, alias="cargoType")
    weight_kg: float | None = Field(default=None, alias="weightKg")
    route: str
    risk_score: int = Field(alias="riskScore")
    status: Literal["monitoring", "stable", "risk_detected"]
    active_route_id: str = Field(alias="activeRouteId")
    selected_route_id: str = Field(alias="selectedRouteId")
    recommended_route_id: str = Field(alias="recommendedRouteId")
    recommended_route: str = Field(alias="recommendedRoute")
    routes: RoutesPayload
    risk: RiskPayload
    prediction: str = ""
    delay_estimate_hours: float = Field(default=0, alias="delayEstimateHours")
    prediction_window: PredictionWindow = Field(alias="predictionWindow")
    delay: DelayPayload
    cascade_impact: CascadeImpact = Field(alias="cascadeImpact")
    decision: DecisionPayload
    alert: AlertPayload
    recommendation: str
    explanation: ExplanationPayload
    ai_explanation: str = Field(default="", alias="aiExplanation")
    alert_flag: bool = Field(default=False, alias="alertFlag")
    active_alert: ShipmentAlert | None = Field(default=None, alias="activeAlert")
    signal_stack: list[SignalSourcePayload] = Field(default_factory=list, alias="signalStack")
    architecture_status: ArchitectureStatusPayload = Field(
        default_factory=lambda: ArchitectureStatusPayload(
            authMode="app_jwt",
            persistenceMode="sqlite",
            analyticsMode="sqlite_audit_log",
            agentMode="local_orchestrator",
            executionMode="fastapi_worker",
            deliveryModes=["dashboard_only"],
            stakeholderRoles=["Shipper", "Transporter", "Receiver", "Admin"],
        ),
        alias="architectureStatus",
    )
    status_message: str = Field(alias="statusMessage")
    dispatch_status: dict[str, str] | None = Field(default=None, alias="dispatchStatus")
    used_fallback_data: bool = Field(alias="usedFallbackData")
    response_time_ms: int = Field(alias="responseTimeMs")
    alert_message: str | None = Field(default=None, alias="alertMessage")
    last_monitored_at: str | None = Field(default=None, alias="lastMonitoredAt")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")


class ShipmentListResponse(BaseModel):
    shipments: list[ShipmentRecord]


class GeocodeResponse(BaseModel):
    location: Location


class AuthLoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return validate_username(value)


class FirebaseAuthExchangeRequest(BaseModel):
    id_token: str = Field(alias="idToken", min_length=20)


class AuthUser(BaseModel):
    id: str
    username: str
    role: Literal["admin", "operator"] = "operator"
    stakeholder_role: Literal["shipper", "transporter", "receiver", "admin"] = Field(default="shipper", alias="stakeholderRole")
    org_id: str = Field(default="default-org", alias="orgId")
    phone_number: str | None = Field(default=None, alias="phoneNumber")
    device_token: str | None = Field(default=None, alias="deviceToken")
    firebase_uid: str | None = Field(default=None, alias="firebaseUid")
    mfa_enabled: bool = Field(default=False, alias="mfaEnabled")
    created_at: str = Field(alias="createdAt")


class AuthUserRecord(AuthUser):
    password_hash: str = Field(alias="passwordHash")


class AuthTokenResponse(BaseModel):
    access_token: str = Field(alias="accessToken")
    token_type: str = Field(default="bearer", alias="tokenType")
    user: AuthUser


class UserCreateRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)
    role: Literal["admin", "operator"] = "operator"
    stakeholder_role: Literal["shipper", "transporter", "receiver", "admin"] = Field(default="shipper", alias="stakeholderRole")
    org_id: str = Field(default="default-org", alias="orgId", min_length=3, max_length=64)
    phone_number: str | None = Field(default=None, alias="phoneNumber", max_length=32)
    device_token: str | None = Field(default=None, alias="deviceToken", max_length=512)
    firebase_email: str | None = Field(default=None, alias="firebaseEmail", max_length=320)
    mfa_enabled: bool = Field(default=False, alias="mfaEnabled")

    @field_validator("username")
    @classmethod
    def normalize_new_username(cls, value: str) -> str:
        return validate_username(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_strength(value)

    @field_validator("org_id")
    @classmethod
    def normalize_org_id(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("phone_number")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        return value.strip() if value else value


class PasswordUpdateRequest(BaseModel):
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_strength(value)


class UserListResponse(BaseModel):
    users: list[AuthUser]


class DeviceTokenUpdateRequest(BaseModel):
    device_token: str = Field(alias="deviceToken", min_length=20, max_length=512)


class FirebaseAuthExchangeResponse(BaseModel):
    firebase_verified: bool = Field(alias="firebaseVerified")
    access_token: str = Field(alias="accessToken")
    token_type: str = Field(default="bearer", alias="tokenType")
    user: AuthUser


class AlertRecord(BaseModel):
    id: str
    org_id: str = Field(default="default-org", alias="orgId")
    shipment_id: str = Field(alias="shipmentId")
    severity: Literal["low", "medium", "high", "critical"]
    message: str
    created_at: str = Field(alias="createdAt")
    status: Literal["open", "resolved"] = "open"


class AuditEventRecord(BaseModel):
    id: str
    org_id: str = Field(default="default-org", alias="orgId")
    shipment_id: str | None = Field(default=None, alias="shipmentId")
    event_type: str = Field(alias="eventType")
    status: str
    actor: str
    detail: str
    metadata: dict[str, object] = Field(default_factory=dict)
    created_at: str = Field(alias="createdAt")
    export_status: dict[str, str] | None = Field(default=None, alias="exportStatus")


class AuditTrailResponse(BaseModel):
    events: list[AuditEventRecord]


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    environment: str
    database: str
    monitoring: str
    auth_mode: str = Field(alias="authMode")
    analytics: str
