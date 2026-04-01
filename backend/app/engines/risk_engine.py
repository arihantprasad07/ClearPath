from __future__ import annotations

from ..schemas import DelayPayload, PredictionWindow, RiskPayload, RiskReason
from ..utils import clamp, format_delay


def compute_risk(
    weather_severity: float,
    traffic: float,
    route_length_km: float,
    weather_summary: str,
    port_severity: float = 0.0,
    road_severity: float = 0.0,
    history_signal: float | None = None,
) -> tuple[RiskPayload, DelayPayload, PredictionWindow]:
    congestion_index = round(
        clamp((traffic * 0.58) + (weather_severity * 0.14) + (port_severity * 0.14) + (road_severity * 0.14), 0, 1),
        2,
    )
    # Historical pattern score can be fed from BigQuery-backed signal history when available.
    # The heuristic formula remains as the fallback path for offline or unconfigured environments.
    heuristic_history = clamp(
        (traffic * 0.35)
        + (route_length_km / 2800) * 0.2
        + (weather_severity * 0.2)
        + (port_severity * 0.12)
        + (road_severity * 0.13),
        0,
        1,
    )
    historical_pattern_score = round(clamp(history_signal if history_signal is not None else heuristic_history, 0, 1), 2)
    weighted = (
        weather_severity * 0.24
        + traffic * 0.21
        + port_severity * 0.11
        + road_severity * 0.12
        + congestion_index * 0.14
        + historical_pattern_score * 0.11
        + clamp(route_length_km / 5000, 0, 1) * 0.07
    )
    score = int(round(clamp(weighted, 0, 1) * 100))
    delay_hours = round(
        0.55
        + weather_severity * 1.4
        + traffic * 1.1
        + port_severity * 0.7
        + road_severity * 0.9
        + congestion_index * 0.65,
        2,
    )
    probability = round(clamp(0.22 + weighted * 0.73, 0, 0.99), 2)

    reasons = [
        RiskReason(
            type="weather",
            icon="WX",
            description=f"Weather signal is building: {weather_summary}",
            impact=f"{int(round(weather_severity * 100))}% weather pressure on the corridor",
        ),
        RiskReason(
            type="traffic",
            icon="MAP",
            description=f"Live traffic is already at {int(round(traffic * 100))}% congestion load",
            impact=f"{int(round(congestion_index * 100))}% congestion spillover risk over the next 24h",
        ),
        RiskReason(
            type="history",
            icon="AI",
            description="Historical disruption patterns show this lane slows early once congestion starts",
            impact=f"{int(round(historical_pattern_score * 100))}% pattern match with prior delay days",
        ),
        RiskReason(
            type="port",
            icon="PORT",
            description="Terminal and corridor congestion is contributing to network fragility",
            impact=f"{int(round(port_severity * 100))}% downstream terminal pressure",
        ),
        RiskReason(
            type="road",
            icon="ROAD",
            description="Road status signals indicate possible blockage or throughput slowdown",
            impact=f"{int(round(road_severity * 100))}% highway disruption pressure",
        ),
    ]

    if score >= 78:
        level = "critical"
    elif score >= 60:
        level = "high"
    elif score >= 38:
        level = "medium"
    else:
        level = "low"

    prediction_window = PredictionWindow(
        startHours=18,
        endHours=24,
        confidence=int(round(probability * 100)),
        label="Predicted disruption window: next 18-24 hours",
    )
    risk = RiskPayload(
        score=score,
        level=level,
        weatherSeverity=round(weather_severity, 2),
        trafficCongestion=round(traffic, 2),
        congestionIndex=congestion_index,
        historicalPatternScore=historical_pattern_score,
        routeLengthKm=round(route_length_km, 1),
        reasons=reasons,
    )
    delay = DelayPayload(hours=delay_hours, text=format_delay(delay_hours), probability=probability)
    return risk, delay, prediction_window
