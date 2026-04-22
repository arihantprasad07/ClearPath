from __future__ import annotations

import asyncio
import time

from ..clients.firebase_functions_client import trigger_function
from ..clients.fcm_client import send_push_notification
from ..clients.gemini_client import generate_explanation
from ..clients.history_client import fetch_history_signal
from ..clients.port_feeds_client import fetch_port_congestion_signal
from ..clients.routes_client import fetch_routes
from ..clients.road_status_client import fetch_road_status_signal
from ..clients.translation_client import translate_text
from ..clients.vertex_agent_client import orchestrate_disruption_workflow
from ..clients.weather_client import fetch_weather_summary
from ..clients.whatsapp_client import send_whatsapp_alert
from ..config import settings
from ..engines.ranking_engine import rank_routes
from ..engines.risk_engine import compute_risk
from ..schemas import (
    AlertPayload,
    AnalyzeRequest,
    AnalyzeResponse,
    ArchitectureStatusPayload,
    CascadeImpact,
    DecisionPayload,
    ExplanationPayload,
    SignalSourcePayload,
    ShipmentSummaryPayload,
)

ALERT_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "gu": "Gujarati",
    "ta": "Tamil",
    "mr": "Marathi",
    "bn": "Bengali",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "as": "Assamese",
    "bho": "Bhojpuri",
    "doi": "Dogri",
    "kok": "Konkani",
    "ks": "Kashmiri",
    "mai": "Maithili",
    "mni-Mtei": "Manipuri",
    "ne": "Nepali",
    "or": "Odia",
    "sa": "Sanskrit",
    "sat": "Santali",
    "sd": "Sindhi",
    "ur": "Urdu",
}


def _confidence_label(probability: float) -> str:
    """Map a probability to a user-facing confidence label."""
    if probability >= 0.75:
        return "High"
    if probability >= 0.5:
        return "Medium"
    return "Low"


def _urgency_label(risk_score: int, priority: str) -> str:
    """Map the risk state and shipment priority to a short urgency label."""
    if risk_score >= 72 or priority == "critical":
        return "Act now"
    if risk_score >= 45 or priority == "express":
        return "Monitor"
    return "Low priority"


def _decision_urgency(urgency_label: str) -> str:
    """Convert explanation urgency copy into the legacy decision enum."""
    mapping = {
        "Act now": "act_now",
        "Monitor": "review",
        "Low priority": "monitor",
    }
    return mapping.get(urgency_label, "review")


def _build_prediction(risk_score: int, delay_hours: float) -> str:
    if risk_score >= 70:
        return f"High probability of delay in next 6-8 hours. Estimated delay: {delay_hours:.1f} hours."
    if risk_score >= 50:
        return f"Moderate probability of delay in next 8-12 hours. Estimated delay: {delay_hours:.1f} hours."
    return f"Low probability of delay in next 12-24 hours. Estimated delay: {delay_hours:.1f} hours."


def _build_cascade_impact(risk_score: int, probability: float, route_count: int, cargo_value: float | None) -> CascadeImpact:
    """Estimate downstream business impact from the current disruption score."""
    cargo_multiplier = 0 if cargo_value is None else min(cargo_value / 250000, 4)
    affected_orders = max(2, int(round(2 + (risk_score / 22) + route_count + cargo_multiplier)))
    if risk_score >= 78:
        severity = "high"
        sla_risk = "Miss likely without reroute"
    elif risk_score >= 60:
        severity = "medium"
        sla_risk = "Promise window at risk"
    else:
        severity = "low"
        sla_risk = "Monitor closely"

    return CascadeImpact(
        severity=severity,
        affectedOrders=affected_orders,
        slaRisk=sla_risk,
        summary=(
            f"If this route slips, about {affected_orders} downstream commitments could feel the impact. "
            f"Current cascade probability is {int(round(probability * 100))}%."
        ),
    )


def _build_decision(best, risk_score: int, prediction: str, probability: float, urgency_label: str, delay_text: str) -> DecisionPayload:
    """Build the operator action block while preserving the current API shape."""
    reason = (
        f"Risk is high because weather and congestion are stacking on the active route. "
        f"{best.name} is better because it lowers route risk and protects ETA."
    )
    return DecisionPayload(
        riskScore=risk_score,
        prediction=prediction,
        recommendedRouteId=best.id,
        recommendedRoute=best.name,
        delayEstimate=delay_text,
        timeSavedMinutes=best.time_saved_minutes,
        reason=reason,
        whyNow=f"{best.trade_off}. A quick approval keeps the lane ahead of the disruption window.",
        urgency=_decision_urgency(urgency_label),
        confidence=int(round(probability * 100)),
        recommendedAction=f"Switch to {best.name} now",
        canReroute=True,
        approvalLabel="Approve in 1 tap",
    )


async def _build_alert(
    source_label: str,
    destination_label: str,
    decision: DecisionPayload,
    delay_text: str,
) -> AlertPayload:
    """Create the multilingual transporter alert payload."""
    english = (
        f"Risk detected on {source_label} to {destination_label}. {decision.recommended_action}. "
        f"Potential delay: {delay_text}. Tap to approve."
    )
    hindi = (
        f"{source_label} se {destination_label} route par risk mila. "
        f"{decision.recommended_action}. Delay {delay_text} ho sakta hai. Approve karein."
    )
    translated_messages = await asyncio.gather(
        *[translate_text(english, language_code) for language_code in ALERT_LANGUAGES],
    )
    translations = {
        language_code: translated
        for language_code, translated in zip(ALERT_LANGUAGES, translated_messages, strict=False)
    }
    translations["en"] = english
    translations["hi"] = hindi if translations.get("hi") == english else translations.get("hi", hindi)

    return AlertPayload(
        channel="whatsapp",
        headline="Predictive disruption alert",
        message=english,
        primaryCta=decision.approval_label,
        fallbackChannel="push_notification_then_sms",
        translations=translations,
    )


def _build_ai_explanation(source_label: str, destination_label: str, weather_summary: str, best_route_name: str, delay_text: str) -> str:
    """Create a compact natural-language explanation for legacy UI surfaces."""
    return (
        f"Your shipment may be delayed due to {weather_summary.lower()} and congestion. "
        f"Switching to {best_route_name} can reduce the delay risk and protect the delivery window by about {delay_text}."
    )


def _build_architecture_status(agent_summary: dict, dispatch_status: dict[str, str]) -> ArchitectureStatusPayload:
    """Summarize the active runtime architecture for transparency panels."""
    return ArchitectureStatusPayload(
        authMode=settings.auth_mode,
        persistenceMode="firestore" if settings.firebase_project_id or settings.firebase_credentials_path else "sqlite",
        analyticsMode="bigquery" if settings.bigquery_dataset and settings.bigquery_table else "sqlite_audit_log",
        agentMode=agent_summary.get("mode", "local_orchestrator"),
        executionMode="firebase_functions" if settings.firebase_functions_enabled else "fastapi_worker",
        deliveryModes=[
            "whatsapp",
            "fcm_push" if settings.fcm_demo_token and (settings.fcm_project_id or settings.fcm_server_key or settings.firebase_project_id) else "dashboard_only",
            dispatch_status.get("status", "skipped"),
        ],
        stakeholderRoles=["Shipper", "Transporter", "Receiver", "Admin"],
    )


def _build_explanation_fallback(
    *,
    risk_score: int,
    prediction: str,
    weather_summary: str,
    traffic: float,
    road_summary: str,
    history_summary: str,
    best_route_name: str,
    best_trade_off: str,
    delay_text: str,
    priority: str,
    probability: float,
) -> dict:
    """Build a heuristic explanation when Gemini is unavailable or malformed."""
    confidence = _confidence_label(probability)
    urgency = _urgency_label(risk_score, priority)
    headline = (
        f"Delay risk is building on the active lane because multiple disruption signals are turning negative."
        if risk_score >= 60
        else "The lane is still moving, but pressure signals suggest it should be watched closely."
    )
    why = (
        f"Weather conditions show {weather_summary.lower()}, while live traffic is already at "
        f"{int(round(traffic * 100))}% corridor load. Road and history signals add pressure as well: "
        f"{road_summary.lower()} and {history_summary.lower()}."
    )
    recommendation = f"Approve {best_route_name} now to reduce exposure; it is {best_trade_off.lower()}."
    return {
        "headline": headline,
        "why": why,
        "recommendation": recommendation,
        "confidence": confidence,
        "urgency": urgency,
        "title": headline,
        "summary": why,
        "cause": prediction,
        "delayEstimate": delay_text,
        "reasoning": [headline, why, recommendation],
    }


def _build_gemini_prompt(
    *,
    source_label: str,
    destination_label: str,
    risk_score: int,
    prediction: str,
    delay_text: str,
    priority: str,
    weather_summary: str,
    traffic: float,
    port_summary: str,
    road_summary: str,
    history_summary: str,
    recommended_route: str,
    trade_off: str,
    reliability: float,
) -> dict:
    """Create the Gemini request payload with Indian logistics-specific guidance."""
    return {
        "system_instruction": {
            "parts": [
                {
                    "text": (
                        "You are ClearPath, an expert Indian logistics AI for SMB operators. "
                        "Explain route disruption risk like an experienced control tower specialist working on Indian corridors. "
                        "Be precise, practical, and easy to act on. Return only valid JSON."
                    )
                }
            ]
        },
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            "Return strict JSON with keys headline, why, recommendation, confidence, urgency. "
                            "headline must be one sharp sentence describing the risk. "
                            "why must be 2-3 sentences that break down the weather, traffic, road, port, and history signals. "
                            "recommendation must be one sentence telling the operator what to do right now. "
                            'confidence must be exactly one of "High", "Medium", or "Low". '
                            'urgency must be exactly one of "Act now", "Monitor", or "Low priority". '
                            "Do not wrap the JSON in markdown fences.\n"
                            f"Lane: {source_label} to {destination_label}.\n"
                            f"Shipment priority: {priority}.\n"
                            f"Risk score: {risk_score}/100.\n"
                            f"Prediction: {prediction}.\n"
                            f"Estimated delay: {delay_text}.\n"
                            f"Weather signal: {weather_summary}.\n"
                            f"Traffic congestion load: {int(round(traffic * 100))}%.\n"
                            f"Port signal: {port_summary}.\n"
                            f"Road signal: {road_summary}.\n"
                            f"History signal: {history_summary}.\n"
                            f"Recommended route: {recommended_route}.\n"
                            f"Recommended route reliability: {int(round(reliability))}%.\n"
                            f"Route trade-off: {trade_off}."
                        )
                    }
                ]
            }
        ],
        "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
    }


async def analyze_route_pair(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze a route pair and return risk, ranking, explanation, and alert payloads."""
    started_at = time.perf_counter()
    raw_routes = await fetch_routes(request.source, request.destination)
    corridor_key = f"{request.source.label or request.source.lat}:{request.destination.label or request.destination.lat}".strip().lower()

    weather_jobs = [fetch_weather_summary(route["waypoints"]) for route in raw_routes]
    weather_results = await asyncio.gather(*weather_jobs)
    port_signal, road_signal, history_signal = await asyncio.gather(
        fetch_port_congestion_signal(),
        fetch_road_status_signal(),
        fetch_history_signal(corridor_key),
    )

    enriched_routes: list[dict] = []
    used_fallback_data = bool(port_signal.get("used_fallback")) or bool(road_signal.get("used_fallback")) or bool(history_signal.get("used_fallback"))
    for route, weather in zip(raw_routes, weather_results):
        used_fallback_data = used_fallback_data or bool(weather.get("used_fallback")) or bool(route.get("used_fallback"))
        enriched_routes.append(
            {
                **route,
                "weather_severity": weather["severity"],
                "weather_summary": weather["summary"],
                "weather_used_fallback": bool(weather.get("used_fallback")),
                "rain": weather["rain"],
                "port_severity": port_signal["severity"],
                "road_severity": road_signal["severity"],
                "history_signal": history_signal["severity"],
            }
        )

    active_route_id = request.active_route_id or "primary"
    primary = next((route for route in enriched_routes if route["id"] == active_route_id), enriched_routes[0])
    risk, delay, prediction_window = compute_risk(
        primary["weather_severity"],
        primary["traffic"],
        primary["distance_km"],
        primary["weather_summary"],
        port_severity=primary["port_severity"],
        road_severity=primary["road_severity"],
        history_signal=primary["history_signal"],
    )
    prediction = _build_prediction(risk.score, delay.hours)
    ranked_routes = rank_routes(enriched_routes, delay.hours, primary["id"])
    best = ranked_routes.options[ranked_routes.recommended_route_id]
    urgency_label = _urgency_label(risk.score, request.priority)
    cascade_impact = _build_cascade_impact(
        risk.score,
        delay.probability,
        len(ranked_routes.options),
        request.estimated_cargo_value,
    )
    decision = _build_decision(best, risk.score, prediction, delay.probability, urgency_label, delay.text)
    source_label = request.source.label or f"{request.source.lat:.2f}, {request.source.lng:.2f}"
    destination_label = request.destination.label or f"{request.destination.lat:.2f}, {request.destination.lng:.2f}"
    alert = await _build_alert(source_label, destination_label, decision, delay.text)
    workflow_summary = await orchestrate_disruption_workflow(
        {
            "source": source_label,
            "destination": destination_label,
            "riskScore": risk.score,
            "weather": primary["weather_summary"],
            "portSummary": port_signal["summary"],
            "roadSummary": road_signal["summary"],
            "historySummary": history_signal["summary"],
            "recommendedRoute": best.name,
        }
    )
    if settings.whatsapp_token and settings.whatsapp_phone_number_id and settings.whatsapp_demo_recipient:
        asyncio.create_task(send_whatsapp_alert(settings.whatsapp_demo_recipient, alert.message))
        dispatch_status = {"status": "queued"}
    else:
        dispatch_status = {"status": "skipped", "reason": "not_configured"}

    if settings.fcm_demo_token and (settings.fcm_project_id or settings.fcm_server_key or settings.firebase_project_id):
        asyncio.create_task(send_push_notification(alert.headline, alert.message))

    if settings.firebase_functions_enabled:
        asyncio.create_task(
            trigger_function(
                "routeDecisionPipeline",
                {
                    "source": source_label,
                    "destination": destination_label,
                    "riskScore": risk.score,
                    "recommendedRouteId": best.id,
                    "dispatchStatus": dispatch_status,
                },
            )
        )

    fallback_ai_explanation = _build_ai_explanation(
        source_label,
        destination_label,
        primary["weather_summary"],
        best.name,
        delay.text,
    )
    fallback = _build_explanation_fallback(
        risk_score=risk.score,
        prediction=prediction,
        weather_summary=primary["weather_summary"],
        traffic=primary["traffic"],
        road_summary=road_signal["summary"],
        history_summary=history_signal["summary"],
        best_route_name=best.name,
        best_trade_off=best.trade_off,
        delay_text=delay.text,
        priority=request.priority,
        probability=delay.probability,
    )
    prompt = _build_gemini_prompt(
        source_label=source_label,
        destination_label=destination_label,
        risk_score=risk.score,
        prediction=prediction,
        delay_text=delay.text,
        priority=request.priority,
        weather_summary=primary["weather_summary"],
        traffic=primary["traffic"],
        port_summary=port_signal["summary"],
        road_summary=road_signal["summary"],
        history_summary=history_signal["summary"],
        recommended_route=best.name,
        trade_off=best.trade_off,
        reliability=best.reliability,
    )
    explanation_dict = await generate_explanation(prompt, fallback)
    explanation = ExplanationPayload(**explanation_dict)
    decision = decision.model_copy(update={"urgency": _decision_urgency(explanation.urgency)})
    ai_explanation = explanation.why or explanation.summary or fallback_ai_explanation
    response_time_ms = int((time.perf_counter() - started_at) * 1000)
    signal_stack = [
        SignalSourcePayload(
            name="IMD weather",
            summary=primary["weather_summary"],
            severity=round(primary["weather_severity"], 2),
            source="weather_api" if not primary.get("weather_used_fallback") else "fallback",
            usedFallback=bool(primary.get("weather_used_fallback")),
        ),
        SignalSourcePayload(
            name="Maps traffic",
            summary=f"Traffic load at {int(round(primary['traffic'] * 100))}% on the active route.",
            severity=round(primary["traffic"], 2),
            source="google_maps" if not primary.get("used_fallback") else "fallback",
            usedFallback=bool(primary.get("used_fallback")),
        ),
        SignalSourcePayload(
            name="Port feeds",
            summary=port_signal["summary"],
            severity=round(port_signal["severity"], 2),
            source=str(port_signal["source"]),
            usedFallback=bool(port_signal["used_fallback"]),
        ),
        SignalSourcePayload(
            name="NHAI roads",
            summary=road_signal["summary"],
            severity=round(road_signal["severity"], 2),
            source=str(road_signal["source"]),
            usedFallback=bool(road_signal["used_fallback"]),
        ),
        SignalSourcePayload(
            name="History",
            summary=history_signal["summary"],
            severity=round(history_signal["severity"], 2),
            source=str(history_signal["source"]),
            usedFallback=bool(history_signal["used_fallback"]),
        ),
    ]
    architecture_status = _build_architecture_status(workflow_summary, dispatch_status)
    status_message = (
        "Using best available estimate. ClearPath still detected risk, generated an alert, orchestrated the decision workflow, and prepared a route recommendation."
        if used_fallback_data
        else f"Live weather, traffic, port, road, and history signals are feeding the risk engine. {workflow_summary['summary']}"
    )

    return AnalyzeResponse(
        shipment=ShipmentSummaryPayload(
            source=source_label,
            destination=destination_label,
            activeRouteId=primary["id"],
            status="risk_detected" if risk.level in {"high", "critical"} else "stable",
        ),
        risk=risk,
        prediction=prediction,
        delayEstimateHours=round(delay.hours, 2),
        predictionWindow=prediction_window,
        delay=delay,
        cascadeImpact=cascade_impact,
        decision=decision,
        alert=alert,
        routes=ranked_routes,
        recommendation=decision.recommended_action,
        explanation=explanation,
        aiExplanation=ai_explanation,
        source=source_label,
        destination=destination_label,
        signalStack=signal_stack,
        architectureStatus=architecture_status,
        statusMessage=status_message,
        dispatchStatus=dispatch_status,
        usedFallbackData=used_fallback_data,
        responseTimeMs=response_time_ms,
        activeRouteId=primary["id"],
    )
