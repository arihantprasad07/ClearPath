from __future__ import annotations

from ..schemas import RouteOption, RoutesPayload
from ..utils import clamp


def _build_trade_off(*, eta: float, baseline_eta: float, cost: float, cheapest_cost: float, reliability: float, risk_score: int) -> str:
    """Summarize the route trade-off in plain operator language."""
    extra_minutes = max(0, int(round((eta - baseline_eta) * 60)))
    if eta <= baseline_eta and cost > cheapest_cost + 120:
        return "Fastest but highest toll cost"
    if reliability >= 90 and extra_minutes > 0:
        return f"Safest but adds {extra_minutes} min"
    if cost <= cheapest_cost + 40 and risk_score >= 55:
        return "Lowest cost but carries more disruption risk"
    if risk_score <= 30 and eta > baseline_eta:
        return f"Low risk with a {extra_minutes} min detour"
    return "Balanced ETA, cost, and reliability"


def rank_routes(
    route_candidates: list[dict], disruption_delay_hours: float, active_route_id: str
) -> RoutesPayload:
    """Rank route candidates and mark the single recommended option."""
    options: dict[str, RouteOption] = {}
    active_route = next(
        (route for route in route_candidates if route["id"] == active_route_id),
        route_candidates[0] if route_candidates else None,
    )
    baseline_eta = active_route["eta"] + disruption_delay_hours if active_route else disruption_delay_hours
    cheapest_cost = min(((candidate["distance_km"] * 0.46) + (candidate["eta"] * 195) for candidate in route_candidates), default=0)
    highest_cost = max(((candidate["distance_km"] * 0.46) + (candidate["eta"] * 195) for candidate in route_candidates), default=0)
    fastest_eta = min((candidate["eta"] for candidate in route_candidates), default=0)
    slowest_eta = max((candidate["eta"] for candidate in route_candidates), default=0)

    for item in route_candidates:
        weather_penalty = item["weather_severity"] * 22
        traffic_penalty = item["traffic"] * 26
        port_penalty = item.get("port_severity", 0) * 12
        road_penalty = item.get("road_severity", 0) * 14
        congestion_index = round(
            clamp(
                item["traffic"] * 0.52
                + item["weather_severity"] * 0.18
                + item.get("port_severity", 0) * 0.14
                + item.get("road_severity", 0) * 0.16,
                0,
                1,
            ),
            2,
        )
        reliability = round(
            clamp(100 - weather_penalty - traffic_penalty - port_penalty - road_penalty - congestion_index * 10, 58, 98),
            1,
        )
        risk_score = int(round(clamp(weather_penalty + traffic_penalty + port_penalty + road_penalty + congestion_index * 18, 8, 95)))
        cost = round((item["distance_km"] * 0.46) + (item["eta"] * 195), 0)
        time_saved_minutes = max(0, int(round((baseline_eta - item["eta"]) * 60)))
        eta_score = clamp(
            ((slowest_eta - item["eta"]) / max(slowest_eta - fastest_eta, 0.1)) * 100,
            0,
            100,
        )
        cost_score = clamp(
            ((highest_cost - cost) / max(highest_cost - cheapest_cost, 1)) * 100,
            0,
            100,
        )
        risk_value = clamp(100 - risk_score, 0, 100)
        value_score = int(round(clamp((cost_score * 0.3) + (risk_value * 0.4) + (eta_score * 0.3), 0, 100)))

        if reliability >= 90 and risk_score <= 35:
            decision_fit = "Best for protecting delivery promise"
        elif cost <= min(candidate["distance_km"] * 0.46 + candidate["eta"] * 195 for candidate in route_candidates) + 40:
            decision_fit = "Best low-cost fallback"
        else:
            decision_fit = "Best balance of speed and reliability"

        options[item["id"]] = RouteOption(
            id=item["id"],
            name=item["name"],
            description=item["description"],
            eta=round(item["eta"], 2),
            distanceKm=round(item["distance_km"], 1),
            traffic=round(item["traffic"], 2),
            congestionIndex=congestion_index,
            cost=cost,
            reliability=reliability,
            riskScore=risk_score,
            waypoints=item["waypoints"],
            timeSavedMinutes=time_saved_minutes,
            weatherSeverity=round(item["weather_severity"], 2),
            decisionFit=decision_fit,
            valueScore=value_score,
            recommendedFlag=False,
            tradeOff=_build_trade_off(
                eta=item["eta"],
                baseline_eta=baseline_eta,
                cost=cost,
                cheapest_cost=cheapest_cost,
                reliability=reliability,
                risk_score=risk_score,
            ),
        )

    recommended = sorted(
        options.values(),
        key=lambda option: (option.risk_score, option.eta, -option.value_score, -option.reliability, option.cost),
    )[0]
    options[recommended.id] = recommended.model_copy(update={"recommended_flag": True})
    return RoutesPayload(recommendedRouteId=recommended.id, options=options)
