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
from ..clients.whatsapp_client import send_whatsapp_alert
from ..config import settings
from ..clients.weather_client import fetch_weather_summary
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


def _build_prediction(risk_score: int, delay_hours: float) -> str:
    if risk_score >= 70:
        return f"High probability of delay in next 6-8 hours. Estimated delay: {delay_hours:.1f} hours."
    if risk_score >= 50:
        return f"Moderate probability of delay in next 8-12 hours. Estimated delay: {delay_hours:.1f} hours."
    return f"Low probability of delay in next 12-24 hours. Estimated delay: {delay_hours:.1f} hours."


def _build_cascade_impact(risk_score: int, probability: float, route_count: int) -> CascadeImpact:
    affected_orders = max(2, int(round(2 + (risk_score / 22) + route_count)))
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


def _build_decision(best, risk_score: int, prediction: str, probability: float) -> DecisionPayload:
    reason = (
        f"Risk is high because weather and congestion are stacking on the active route. "
        f"{best.name} is better because it lowers route risk and protects ETA."
    )
    return DecisionPayload(
        riskScore=risk_score,
        prediction=prediction,
        recommendedRouteId=best.id,
        recommendedRoute=best.name,
        reason=reason,
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
    return (
        f"Your shipment may be delayed due to {weather_summary.lower()} and congestion. "
        f"Switching to {best_route_name} can reduce the delay risk and protect the delivery window by about {delay_text}."
    )


def _build_architecture_status(agent_summary: dict, dispatch_status: dict[str, str]) -> ArchitectureStatusPayload:
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


async def analyze_route_pair(request: AnalyzeRequest) -> AnalyzeResponse:
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
    cascade_impact = _build_cascade_impact(risk.score, delay.probability, len(ranked_routes.options))
    decision = _build_decision(best, risk.score, prediction, delay.probability)
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
    fallback = {
        "title": "Predicted disruption needs action",
        "summary": fallback_ai_explanation,
        "cause": f"Combined signal: {primary['weather_summary']} with rising traffic pressure.",
        "delayEstimate": delay.text,
        "recommendation": decision.recommended_action,
        "confidence": f"{decision.confidence}%",
        "reasoning": [
            f"Risk is {risk.score}% because bad weather and congestion are building together.",
            f"{best.name} is safer because it has lower route risk and better ETA protection.",
            "Priya should approve the route change now to avoid a later delay.",
        ],
    }
    prompt = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            "Return plain JSON with keys title, summary, cause, delayEstimate, recommendation, confidence, reasoning. "
                            "Write a simple explanation for Priya, a small business owner. "
                            "Explain why the risk is high, why the recommended route is better, and what action she should take now. "
                            f"Source: {source_label}. Destination: {destination_label}. "
                            f"Risk score: {risk.score}. Prediction: {prediction}. Delay estimate: {delay.text}. "
                            f"Weather cause: {primary['weather_summary']}. Recommended route: {best.name}. "
                            f"Route reliability: {int(round(best.reliability))} percent. "
                            "Keep the summary in one or two short sentences."
                        )
                    }
                ]
            }
        ],
        "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
    }
    explanation_dict = await generate_explanation(prompt, fallback)
    explanation = ExplanationPayload(**explanation_dict)
    ai_explanation = explanation.summary or fallback_ai_explanation
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
